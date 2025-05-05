import nock from 'nock'
import sinon from 'sinon'
import { ensurenovalnetWebhooksForAllProjects } from '../../src/config/init/ensure-novalnet-webhook.js'

import config from '../../src/config/config.js'
import { getLogger } from '../../src/utils/logger.js'

describe('verify ensure-novalnet-webhook', () => {
  afterEach(() => {
    config.getnovalnetConfig.restore()
  })
  it('provided that webhook is existing in novalnet merchant account, no new webhook is created', async () => {
    const novalnetMerchantAccount0 = config.getAllnovalnetMerchantAccounts()[0]
    const novalnetMerchantAccount1 = config.getAllnovalnetMerchantAccounts()[1]
    const novalnetConfig0 = config.getnovalnetConfig(novalnetMerchantAccount0)
    const novalnetConfig1 = config.getnovalnetConfig(novalnetMerchantAccount1)

    novalnetConfig0.notificationBaseUrl = 'https://test-notification'
    sinon
      .stub(config, 'getnovalnetConfig')
      .withArgs(novalnetMerchantAccount0)
      .returns(novalnetConfig0)
      .withArgs(novalnetMerchantAccount1)
      .returns(novalnetConfig1)

    const fetchWebhookResponse = {
      data: [
        {
          id: 'webhook-1',
          type: 'standard',
          url: novalnetConfig0.notificationBaseUrl,
          description: 'commercetools-novalnet-integration notification webhook',
          active: true,
        },
      ],
    }

    nock(
      `https://management-test.novalnet.com/v1/merchants/${novalnetMerchantAccount0}`,
    )
      .get('/webhooks')
      .reply(200, fetchWebhookResponse)

    const logSpy = sinon.spy()
    const logger = getLogger()
    logger.info = logSpy
    sinon.stub(getLogger(), 'child').returns(logger)

    await ensurenovalnetWebhooksForAllProjects()
    const message =
      'Webhook already existed with ID webhook-1. ' +
      'Skipping webhook creation and ensuring the webhook is active'
    sinon.assert.calledOnce(logSpy)
    sinon.assert.calledWith(logSpy, message)
  })
})
