import fetch from 'node-fetch'
import { serializeError } from 'serialize-error'
import config from '../config/config.js'
import utils from '../utils.js'

async function getPaymentMethods(merchantAccount, getPaymentMethodsRequestObj) {
  const novalnetCredentials = config.getnovalnetConfig(merchantAccount)
  return callnovalnet(
    `${novalnetCredentials.apiBaseUrl}/paymentMethods`,
    merchantAccount,
    novalnetCredentials.apiKey,
    await extendRequestObjWithApplicationInfo(getPaymentMethodsRequestObj),
  )
}

async function makePayment(
  merchantAccount,
  commercetoolsProjectKey,
  makePaymentRequestObj,
) {
  const novalnetCredentials = config.getnovalnetConfig(merchantAccount)
  extendRequestObjWithMetadata(makePaymentRequestObj, commercetoolsProjectKey)
  await extendRequestObjWithApplicationInfo(makePaymentRequestObj)
  removeAddCommercetoolsLineItemsField(makePaymentRequestObj)
  return callnovalnet(
    `${novalnetCredentials.apiBaseUrl}/payments`,
    merchantAccount,
    novalnetCredentials.apiKey,
    makePaymentRequestObj,
  )
}

function submitAdditionalPaymentDetails(
  merchantAccount,
  commercetoolsProjectKey,
  submitAdditionalPaymentDetailsRequestObj,
) {
  const novalnetCredentials = config.getnovalnetConfig(merchantAccount)
  extendRequestObjWithMetadata(
    submitAdditionalPaymentDetailsRequestObj,
    commercetoolsProjectKey,
  )
  return callnovalnet(
    `${novalnetCredentials.apiBaseUrl}/payments/details`,
    merchantAccount,
    novalnetCredentials.apiKey,
    submitAdditionalPaymentDetailsRequestObj,
  )
}

function removeAddCommercetoolsLineItemsField(createSessionRequestObj) {
  // This flag is considered deprecated
  // If createSessionRequestObj contains this flag, it should be deleted
  // Otherwise novalnet might return a 400 response with the following message:
  // Structure of PaymentRequest contains the following unknown fields: [addCommercetoolsLineItems]
  delete createSessionRequestObj.addCommercetoolsLineItems
}

function manualCapture(
  merchantAccount,
  commercetoolsProjectKey,
  idempotencyKey,
  manualCaptureRequestObj,
) {
  const novalnetCredentials = config.getnovalnetConfig(merchantAccount)
  return callnovalnet(
    `${novalnetCredentials.apiBaseUrl}/payments/${manualCaptureRequestObj.originalReference}/captures`,
    merchantAccount,
    novalnetCredentials.apiKey,
    {
      amount: manualCaptureRequestObj.modificationAmount,
      reference: manualCaptureRequestObj?.reference,
    },
    idempotencyKey && { 'Idempotency-Key': idempotencyKey },
  )
}

function cancelPayment(
  merchantAccount,
  commercetoolsProjectKey,
  cancelPaymentRequestObj,
) {
  const novalnetCredentials = config.getnovalnetConfig(merchantAccount)
  return callnovalnet(
    `${novalnetCredentials.apiBaseUrl}/payments/${cancelPaymentRequestObj.originalReference}/cancels`,
    merchantAccount,
    novalnetCredentials.apiKey,
    {
      reference: cancelPaymentRequestObj?.reference,
    },
  )
}

function refund(
  merchantAccount,
  commercetoolsProjectKey,
  idempotencyKey,
  refundRequestObj,
) {
  const novalnetCredentials = config.getnovalnetConfig(merchantAccount)
  return callnovalnet(
    `${novalnetCredentials.apiBaseUrl}/payments/${refundRequestObj.originalReference}/refunds`,
    merchantAccount,
    novalnetCredentials.apiKey,
    {
      amount: refundRequestObj.modificationAmount,
      reference: refundRequestObj?.reference,
    },
    idempotencyKey && { 'Idempotency-Key': idempotencyKey },
  )
}

function getCarbonOffsetCosts(merchantAccount, getCarbonOffsetCostsRequestObj) {
  const novalnetCredentials = config.getnovalnetConfig(merchantAccount)
  return callnovalnet(
    `${novalnetCredentials.apiBaseUrl}/carbonOffsetCosts`,
    merchantAccount,
    novalnetCredentials.apiKey,
    getCarbonOffsetCostsRequestObj,
  )
}

function updateAmount(
  merchantAccount,
  commercetoolsProjectKey,
  amountUpdatesRequestObj,
) {
  const novalnetCredentials = config.getnovalnetConfig(merchantAccount)
  const paymentPspReference = amountUpdatesRequestObj.paymentPspReference
  return callnovalnet(
    `${novalnetCredentials.apiBaseUrl}/payments/${paymentPspReference}/amountUpdates`,
    merchantAccount,
    novalnetCredentials.apiKey,
    amountUpdatesRequestObj,
  )
}

async function createSessionRequest(
  merchantAccount,
  commercetoolsProjectKey,
  requestObject,
) {
  extendRequestObjWithMetadata(requestObject, commercetoolsProjectKey)
  await extendRequestObjWithApplicationInfo(requestObject)
  removeAddCommercetoolsLineItemsField(requestObject)
  const novalnetCredentials = config.getnovalnetConfig(merchantAccount)
  return callnovalnet(
    `${novalnetCredentials.apiBaseUrl}/sessions`,
    merchantAccount,
    novalnetCredentials.apiKey,
    requestObject,
  )
}

async function disableStoredPayment(
  merchantAccount,
  disableStoredPaymentRequestObj,
) {
  const novalnetCredentials = config.getnovalnetConfig(merchantAccount)

  const recurringReference =
    disableStoredPaymentRequestObj.recurringDetailReference
  const url = `${novalnetCredentials.apiBaseUrl}/storedPaymentMethods/${recurringReference}`
  delete disableStoredPaymentRequestObj.recurringDetailReference

  const result = await callnovalnet(
    url,
    merchantAccount,
    novalnetCredentials.apiKey,
    disableStoredPaymentRequestObj,
    [],
    'DELETE',
  )

  if (!result.response) {
    result.response = { response: '[detail-successfully-disabled]' }
  }

  return result
}

async function extendRequestObjWithApplicationInfo(requestObj) {
  const packageJson = await utils.readAndParseJsonFile('package.json')
  requestObj.applicationInfo = {
    merchantApplication: {
      name: packageJson.name,
      version: packageJson.version,
    },
    externalPlatform: {
      name: 'commercetools',
      integrator: packageJson.author.name,
    },
  }
  return requestObj
}

function extendRequestObjWithMetadata(requestObj, commercetoolsProjectKey) {
  if (requestObj.metadata) {
    requestObj.metadata = {
      ...requestObj.metadata,
      ctProjectKey: commercetoolsProjectKey,
    }
  } else {
    requestObj.metadata = {
      // metadata key must have length of max. 20 chars
      // metadata value must have length of max. 80 chars
      ctProjectKey: commercetoolsProjectKey,
    }
  }
}

async function callnovalnet(
  url,
  novalnetMerchantAccount,
  novalnetApiKey,
  requestArg,
  headers,
  methodOverride,
) {
  let returnedRequest
  let returnedResponse
  try {
    const { response, request } = await fetchAsync(
      url,
      novalnetMerchantAccount,
      novalnetApiKey,
      requestArg,
      headers,
      methodOverride,
    )
    returnedRequest = request
    returnedResponse = response
  } catch (err) {
    returnedRequest = { body: JSON.stringify(requestArg) }
    returnedResponse = serializeError(err)
  }

  return { request: returnedRequest, response: returnedResponse }
}

async function fetchAsync(
  url,
  novalnetMerchantAccount,
  novalnetApiKey,
  requestObj,
  headers,
  methodOverride,
) {
  const moduleConfig = config.getModuleConfig()
  const removeSensitiveData =
    requestObj.removeSensitiveData ?? moduleConfig.removeSensitiveData
  delete requestObj.removeSensitiveData
  let response
  let responseBody
  let responseBodyInText
  const request = buildRequest(
    novalnetMerchantAccount,
    novalnetApiKey,
    requestObj,
    headers,
    methodOverride,
  )

  if (methodOverride === 'DELETE') {
    url += `?${request.body}`
    delete request.body
  }

  try {
    response = await fetch(url, request)
    responseBodyInText = await response.text()

    responseBody = responseBodyInText ? JSON.parse(responseBodyInText) : ''
  } catch (err) {
    if (response)
      // Handle non-JSON format response
      throw new Error(
        `Unable to receive non-JSON format resposne from novalnet API : ${responseBodyInText}`,
      )
    // Error in fetching URL
    else throw err
  } finally {
    // strip away sensitive data from the novalnet response.
    request.headers['X-Api-Key'] = '***'
    if (removeSensitiveData && responseBody) {
      delete responseBody.additionalData
    }
  }
  return { response: responseBody, request }
}

function buildRequest(
  novalnetMerchantAccount,
  novalnetApiKey,
  requestObj,
  headers,
  methodOverride,
) {
  // Note: ensure the merchantAccount is set with request, otherwise set
  // it with the value from novalnetMerchantAccount payment custom field
  if (!requestObj.merchantAccount)
    requestObj.merchantAccount = novalnetMerchantAccount

  const requestHeaders = {
    'Content-Type': 'application/json',
    'X-Api-Key': novalnetApiKey,
    ...headers,
  }

  if (methodOverride === 'DELETE') {
    return {
      method: methodOverride,
      headers: requestHeaders,
      body: new URLSearchParams(requestObj),
    }
  }

  return {
    method: methodOverride || 'POST',
    body: JSON.stringify(requestObj),
    headers: requestHeaders,
  }
}

export {
  getPaymentMethods,
  makePayment,
  submitAdditionalPaymentDetails,
  manualCapture,
  refund,
  cancelPayment,
  getCarbonOffsetCosts,
  updateAmount,
  disableStoredPayment,
  createSessionRequest,
}
