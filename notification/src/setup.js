import config from './config/config.js'
import { getLogger } from './utils/logger.js'
// eslint-disable-next-line @stylistic/js/max-len
import { ensureInterfaceInteractionCustomTypeForAllProjects } from './config/init/ensure-interface-interaction-custom-type.js'
import { ensurenovalnetWebhooksForAllProjects } from './config/init/ensure-novalnet-webhook.js'

const logger = getLogger()

async function setupNotificationResources() {
  await ensurenovalnetWebhooksForAllProjects()
  await ensureInterfaceInteractionCustomTypeForAllProjects()

  const ctpProjectKeys = config.getAllCtpProjectKeys()
  const novalnetMerchantAccounts = config.getAllnovalnetMerchantAccounts()

  logger.info(
    `Configured commercetools project keys are: ${JSON.stringify(
      ctpProjectKeys,
    )}. ` +
      `Configured novalnet merchant accounts are: ${JSON.stringify(
        novalnetMerchantAccounts,
      )}`,
  )
}

export { setupNotificationResources }
