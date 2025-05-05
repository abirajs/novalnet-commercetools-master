import { expect } from 'chai'
import _ from 'lodash'
import nock from 'nock'
import { randomInt } from 'node:crypto'
import createSessionSuccessResponse from './fixtures/novalnet-create-session-success-response.js'
import createSessionRequestPaymentHandler from '../../src/paymentHandler/sessions-request.handler.js'
import config from '../../src/config/config.js'
import utils from '../../src/utils.js'

describe('::Multitenancy::', () => {
  let novalnetApiScope
  let ctpApiScope
  const ctpProjectKey = `ctpProjectKey${randomInt(1, 4)}`
  const novalnetMerchantAccount = `novalnetMerchantAccount${randomInt(1, 4)}`
  let ctpPayment
  let ctpCart

  before(async () => {
    ctpPayment = await utils.readAndParseJsonFile(
      'test/unit/fixtures/ctp-payment.json',
    )
    ctpCart = await utils.readAndParseJsonFile(
      'test/unit/fixtures/ctp-cart.json',
    )
  })

  beforeEach(() => {
    const novalnetConfig = config.getnovalnetConfig(novalnetMerchantAccount)
    novalnetApiScope = nock(`${novalnetConfig.apiBaseUrl}`)
  })

  it(
    'when config has multiple projects, ' +
      'extension should call the correct novalnet and commercetools project',
    async () => {
      _mockCtpCartsEndpoint()
      novalnetApiScope.post('/sessions').reply(200, createSessionSuccessResponse)

      const createSessionRequest = {
        reference: 'YOUR_REFERENCE',
      }

      const ctpPaymentClone = _.cloneDeep(ctpPayment)
      ctpPaymentClone.custom.fields.createSessionRequest =
        JSON.stringify(createSessionRequest)
      ctpPaymentClone.custom.fields.novalnetMerchantAccount = novalnetMerchantAccount
      ctpPaymentClone.custom.fields.commercetoolsProjectKey = ctpProjectKey

      const response =
        await createSessionRequestPaymentHandler.execute(ctpPaymentClone)
      const novalnetRequest = JSON.parse(
        response.actions.find((a) => a.action === 'addInterfaceInteraction')
          .fields.request,
      )
      const novalnetRequestBody = JSON.parse(novalnetRequest.body)
      expect(novalnetRequestBody.merchantAccount).to.equal(novalnetMerchantAccount)
      expect(ctpApiScope.isDone()).to.be.true
    },
  )

  function _mockCtpCartsEndpoint(mockCart = ctpCart) {
    const ctpConfig = config.getCtpConfig(ctpProjectKey)
    ctpApiScope = nock(`${ctpConfig.apiUrl}`)
    const ctpAuthScope = nock(`${ctpConfig.authUrl}`)
    ctpAuthScope.post('/oauth/token').reply(200, {
      access_token: 'xxx',
      token_type: 'Bearer',
      expires_in: 172800,
      scope: 'manage_project:xxx',
    })
    ctpApiScope
      .get(`/${ctpProjectKey}/carts`)
      .query(true)
      .reply(200, { results: [mockCart] })
  }
})
