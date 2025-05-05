import fetch from 'node-fetch'
import { serializeError } from 'serialize-error'
import { getLogger } from '../../utils/logger.js'
import config from '../config.js'
import { loadConfig } from '../config-loader.js'

const mainLogger = getLogger()

async function ensurenovalnetWebhook(novalnetApiKey, webhookUrl, merchantId) {
  try {
    const logger = mainLogger.child({
      novalnet_merchant_id: merchantId,
    })

    const webhookConfig = {
      type: 'standard',
      url: webhookUrl,
      active: 'true',
      communicationFormat: 'json',
      description: 'commercetools-novalnet-integration notification webhook',
    }

    const getWebhookResponse = await fetch(
      `https://management-test.novalnet.com/v1/merchants/${merchantId}/webhooks`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': novalnetApiKey,
        },
      },
    )
    const getWebhookResponseJson = await getWebhookResponse.json()

    const existingWebhook = getWebhookResponseJson.data?.find(
      (webhook) =>
        webhook.url === webhookConfig.url &&
        webhook.type === webhookConfig.type,
    )

    if (existingWebhook) {
      logger.info(
        `Webhook already existed with ID ${existingWebhook.id}. ` +
          'Skipping webhook creation and ensuring the webhook is active',
      )
      if (!existingWebhook.active)
        await fetch(
          `https://management-test.novalnet.com/v1/merchants/${merchantId}/webhooks/${existingWebhook.id}`,
          {
            body: JSON.stringify({
              active: true,
            }),
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': novalnetApiKey,
            },
          },
        )
      return existingWebhook.id
    }

    const createWebhookResponse = await fetch(
      `https://management-test.novalnet.com/v1/merchants/${merchantId}/webhooks`,
      {
        body: JSON.stringify(webhookConfig),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': novalnetApiKey,
        },
      },
    )

    const createWebhookResponseJson = await createWebhookResponse.json()
    const webhookId = createWebhookResponseJson.id

    logger.info(`New webhook was created with ID ${webhookId}`)
    return webhookId
  } catch (err) {
    throw Error(
      `Failed to ensure novalnet webhook for project ${merchantId}.` +
        `Error: ${JSON.stringify(serializeError(err))}`,
    )
  }
}

async function ensurenovalnetHmac(novalnetApiKey, merchantId, webhookId) {
  const logger = mainLogger.child({
    novalnet_merchant_id: merchantId,
  })

  const generateHmacResponse = await fetch(
    `https://management-test.novalnet.com/v1/merchants/${merchantId}/webhooks/${webhookId}/generateHmac`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': novalnetApiKey,
      },
    },
  )

  const generateHmacResponseJson = await generateHmacResponse.json()
  const { hmacKey } = generateHmacResponseJson

  logger.info(`New HMAC was generated: ${hmacKey}`)

  return hmacKey
}

async function ensurenovalnetWebhooksForAllProjects() {
  const novalnetMerchantAccounts = config.getAllnovalnetMerchantAccounts()
  const jsonConfig = loadConfig()

  for (const novalnetMerchantId of novalnetMerchantAccounts) {
    const novalnetConfig = config.getnovalnetConfig(novalnetMerchantId)

    if (novalnetConfig.notificationBaseUrl) {
      const webhookId = await ensurenovalnetWebhook(
        novalnetConfig.apiKey,
        novalnetConfig.notificationBaseUrl,
        novalnetMerchantId,
      )
      if (novalnetConfig.enableHmacSignature && !novalnetConfig.secretHmacKey) {
        const hmacKey = await ensurenovalnetHmac(
          novalnetConfig.apiKey,
          novalnetMerchantId,
          webhookId,
        )
        jsonConfig.novalnet[novalnetMerchantId].secretHmacKey = hmacKey
      }
    }
  }
}

export { ensurenovalnetWebhooksForAllProjects }
