import lodash from 'lodash'
import { loadConfig } from './config-loader.js'

const { isEmpty } = lodash
let config

function getModuleConfig() {
  let removeSensitiveData = config.removeSensitiveData !== 'false'
  if (config.removeSensitiveData === false) removeSensitiveData = false
  return {
    removeSensitiveData,
    port: config.port,
    logLevel: config.logLevel,
    keepAliveTimeout: !Number.isNaN(config.keepAliveTimeout)
      ? parseFloat(config.keepAliveTimeout, 10)
      : undefined,
  }
}

function getCtpConfig(ctpProjectKey) {
  const ctpConfig = config.commercetools[ctpProjectKey]
  if (!ctpConfig)
    throw new Error(
      `Configuration is not provided. Please update the configuration. ctpProjectKey: [${JSON.stringify(
        ctpProjectKey,
      )}]`,
    )
  return {
    clientId: ctpConfig.clientId,
    clientSecret: ctpConfig.clientSecret,
    projectKey: ctpProjectKey,
    apiUrl:
      ctpConfig.apiUrl || 'https://api.europe-west1.gcp.commercetools.com',
    authUrl:
      ctpConfig.authUrl || 'https://auth.europe-west1.gcp.commercetools.com',
  }
}

function getnovalnetConfig(novalnetMerchantAccount) {
  const novalnetConfig = config.novalnet[novalnetMerchantAccount]
  if (!novalnetConfig)
    throw new Error(
      `Configuration for novalnetMerchantAccount is not provided. Please update the configuration: ${JSON.stringify(
        novalnetMerchantAccount,
      )}`,
    )

  let enableHmacSignature = novalnetConfig.enableHmacSignature !== 'false'
  if (novalnetConfig.enableHmacSignature === false) enableHmacSignature = false
  return {
    secretHmacKey: novalnetConfig.secretHmacKey,
    notificationBaseUrl:
      process.env.CONNECT_SERVICE_URL ?? novalnetConfig.notificationBaseUrl,
    enableHmacSignature,
    apiKey: novalnetConfig.apiKey,
  }
}

function getAllCtpProjectKeys() {
  return Object.keys(config.commercetools)
}

function getAllnovalnetMerchantAccounts() {
  return Object.keys(config.novalnet)
}

function getnovalnetPaymentMethodsToNames() {
  return {
    scheme: { en: 'Credit Card' },
    pp: { en: 'PayPal' },
    klarna: { en: 'Klarna' },
    affirm: { en: 'Affirm' },
    gpay: { en: 'Google Pay' },
    ...(config.novalnetPaymentMethodsToNames || {}),
  }
}

function loadAndValidateConfig() {
  config = loadConfig()

  const numberOfCtpConfigs = Object.keys(config.commercetools).length
  const numberOfnovalnetConfigs = Object.keys(config.novalnet).length
  if (numberOfCtpConfigs === 0)
    throw new Error(
      'Please add at least one commercetools project to the config',
    )
  if (numberOfnovalnetConfigs === 0)
    throw new Error(
      'Please add at least one novalnet merchant account to the config',
    )

  for (const [ctpProjectKey, ctpConfig] of Object.entries(
    config.commercetools,
  )) {
    if (!ctpConfig.clientId || !ctpConfig.clientSecret)
      throw new Error(
        `[${ctpProjectKey}]: CTP project credentials are missing. ` +
          'Please verify that all projects have projectKey, clientId and clientSecret',
      )
  }

  const argv = process.argv[3]

  if (argv === 'setupNotificationResources')
    // skip validation of HMAC because this command is setting them up
    // and validation at this point would fail
    return

  for (const [novalnetMerchantAccount, novalnetConfig] of Object.entries(
    config.novalnet,
  )) {
    if (
      novalnetConfig.enableHmacSignature !== 'false' &&
      isEmpty(novalnetConfig.secretHmacKey)
    )
      throw new Error(
        `[${novalnetMerchantAccount}]: The "secretHmacKey" config variable is missing to be able to verify ` +
          `notifications, please generate a secret HMAC key in novalnet Customer Area ` +
          `or set "enableHmacSignature=false" to disable the verification feature.`,
      )
  }
}

loadAndValidateConfig()

// Using default, because the file needs to be exported as object.
export default {
  getModuleConfig,
  getCtpConfig,
  getnovalnetConfig,
  getAllCtpProjectKeys,
  getAllnovalnetMerchantAccounts,
  getnovalnetPaymentMethodsToNames,
}
