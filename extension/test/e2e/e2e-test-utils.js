import { expect } from 'chai'
import puppeteer from 'puppeteer'
import path from 'path'
import fs from 'fs'
import { getLatestInterfaceInteraction } from '../../src/paymentHandler/payment-utils.js'
import c from '../../src/config/constants.js'

async function pasteValue(page, selector, value) {
  return page.evaluate(
    (data) => {
      // eslint-disable-next-line no-undef
      document.querySelector(data.selector).value = data.value
    },
    { selector, value },
  )
}

async function executeInnovalnetIframe(page, selector, executeFn) {
  for (const frame of page.mainFrame().childFrames()) {
    const elementHandle = await frame.$(selector)
    if (elementHandle) {
      await executeFn(elementHandle, frame)
      break
    }
  }
}

async function initPuppeteerBrowser() {
  return puppeteer.launch({
    headless: 'new',
    ignoreHTTPSErrors: true,
    args: [
      '--disable-web-security',
      '--disable-features=SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure,IsolateOrigins,site-per-process',
      // user-agent is overriden to bypass the "reminder" page of localtunnel module
      '--user-agent=curl/7.64.1',
    ],
  })
}

async function getCreateSessionRequest(baseUrl, clientKey, currency = 'EUR') {
  return JSON.stringify({
    amount: {
      currency,
      value: 1000,
    },
    reference: new Date().getTime(),
    returnUrl: `${baseUrl}/return-url`,
    additionalData: {
      authorisationType: 'PreAuth',
    },
  })
}

function assertCreatePaymentSession(
  paymentAfterCreateSession,
  initPaymentSessionResult,
) {
  const { createSessionResponse } = paymentAfterCreateSession.custom.fields
  const initPaymentSessionResultJson = JSON.parse(initPaymentSessionResult)

  const finalnovalnetPaymentInteraction = getLatestInterfaceInteraction(
    paymentAfterCreateSession.interfaceInteractions,
    c.CTP_INTERACTION_TYPE_CREATE_SESSION,
  )

  expect(finalnovalnetPaymentInteraction.fields.response).to.equal(
    createSessionResponse,
  )
  expect(initPaymentSessionResultJson.resultCode).to.equal('Authorised')
  expect(initPaymentSessionResultJson.sessionData).to.not.equal('undefined')
}

async function createPaymentSession(
  ctpClient,
  novalnetMerchantAccount,
  commercetoolsProjectKey,
  createSessionRequest,
  currency = 'EUR',
) {
  const paymentDraft = {
    amountPlanned: {
      currencyCode: currency,
      centAmount: 1000,
    },
    paymentMethodInfo: {
      paymentInterface: c.CTP_novalnet_INTEGRATION,
    },
    custom: {
      type: {
        typeId: 'type',
        key: c.CTP_PAYMENT_CUSTOM_TYPE_KEY,
      },
      fields: {
        novalnetMerchantAccount,
        commercetoolsProjectKey,
        createSessionRequest,
      },
    },
  }

  const { body: payment } = await ctpClient.create(
    ctpClient.builder.payments,
    paymentDraft,
  )
  return payment
}

function assertPayment(
  payment,
  finalnovalnetPaymentInteractionName = 'submitAdditionalPaymentDetails',
) {
  const {
    [`${finalnovalnetPaymentInteractionName}Response`]:
      finalnovalnetPaymentResponseString,
  } = payment.custom.fields
  const finalnovalnetPaymentResponse = JSON.parse(finalnovalnetPaymentResponseString)
  expect(finalnovalnetPaymentResponse.resultCode).to.equal(
    'Authorised',
    `resultCode is not Authorised: ${finalnovalnetPaymentResponseString}`,
  )
  expect(finalnovalnetPaymentResponse.pspReference).to.match(
    /[A-Z0-9]+/,
    `pspReference does not match '/[A-Z0-9]+/': ${finalnovalnetPaymentResponseString}`,
  )

  const finalnovalnetPaymentInteraction = getLatestInterfaceInteraction(
    payment.interfaceInteractions,
    finalnovalnetPaymentInteractionName,
  )
  expect(finalnovalnetPaymentInteraction.fields.response).to.equal(
    finalnovalnetPaymentResponseString,
  )

  expect(payment.transactions).to.have.lengthOf(1)
  const transaction = payment.transactions[0]
  expect(transaction.state).to.equal('Success')
  expect(transaction.type).to.equal('Authorization')
  expect(transaction.interactionId).to.equal(
    finalnovalnetPaymentResponse.pspReference,
  )
  expect(transaction.amount.centAmount).to.equal(
    payment.amountPlanned.centAmount,
  )
  expect(transaction.amount.currencyCode).to.equal(
    payment.amountPlanned.currencyCode,
  )
}

async function createPayment(
  ctpClient,
  novalnetMerchantAccount,
  commercetoolsProjectKey,
  makePaymentRequest,
  currency = 'EUR',
) {
  const paymentDraft = {
    amountPlanned: {
      currencyCode: currency,
      centAmount: 1000,
    },
    paymentMethodInfo: {
      paymentInterface: c.CTP_novalnet_INTEGRATION,
    },
    custom: {
      type: {
        typeId: 'type',
        key: c.CTP_PAYMENT_CUSTOM_TYPE_KEY,
      },
      fields: {
        novalnetMerchantAccount,
        commercetoolsProjectKey,
        makePaymentRequest,
      },
    },
  }

  const { body: payment } = await ctpClient.create(
    ctpClient.builder.payments,
    paymentDraft,
  )
  return payment
}

function serveFile(pathName, req, res) {
  const resolvedBase = path.resolve(pathName)
  const fileLoc = path.join(resolvedBase)

  fs.readFile(fileLoc, (err, data) => {
    if (err) {
      res.writeHead(404, 'Not Found')
      res.write('404: File Not Found!')
      return res.end()
    }

    res.statusCode = 200

    res.write(data)
    return res.end()
  })
}

function getRequestParams(url) {
  const queries = url.split('?')
  const result = {}
  if (queries.length >= 2) {
    queries[1].split('&').forEach((item) => {
      try {
        result[item.split('=')[0]] = item.split('=')[1]
        // eslint-disable-next-line no-unused-vars
      } catch (e) {
        result[item.split('=')[0]] = ''
      }
    })
  }
  return result
}

export {
  pasteValue,
  executeInnovalnetIframe,
  assertCreatePaymentSession,
  getCreateSessionRequest,
  createPaymentSession,
  assertPayment,
  createPayment,
  initPuppeteerBrowser,
  serveFile,
  getRequestParams,
}
