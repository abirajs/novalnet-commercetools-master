import { loadConfig } from './config-loader.js'

let config

function getModuleConfig() {
  return {
    removeSensitiveData: _getValueOfBooleanFlag(
      config.removeSensitiveData,
      true,
    ),
    port: config.port,
    logLevel: config.logLevel,
    // If used for development purpose and for setup-resources command
    apiExtensionBaseUrl:
      process.env.CONNECT_SERVICE_URL ?? config.apiExtensionBaseUrl,
    basicAuth: config.basicAuth || false,
    keepAliveTimeout: !Number.isNaN(config.keepAliveTimeout)
      ? parseFloat(config.keepAliveTimeout, 10)
      : undefined,
    generateIdempotencyKey: _getValueOfBooleanFlag(
      config.generateIdempotencyKey,
      false,
    ),
  }
}

function _getValueOfBooleanFlag(value, defaultValue) {
  if (value === undefined) {
    return defaultValue
  }

  if (value === true || value === 'true') {
    return true
  }

  if (value === false || value === 'false') {
    return false
  }

  return defaultValue
}

function _validateAuthenticationConfig(ctpConfig) {
  if (getModuleConfig().basicAuth === true && !ctpConfig.authentication) {
    return 'Basic authentication is enabled but authentication setting is missing.'
  }

  if (ctpConfig.authentication) {
    if (
      ctpConfig.authentication.scheme?.toLowerCase() !== 'basic' ||
      !ctpConfig.authentication.username ||
      !ctpConfig.authentication.password
    ) {
      // scheme must be basic type, and username and password must be all provided if authentication object exists
      return 'Attributes (scheme, username or password) is missing in authentication setting.'
    }
    return null
  }
  return null
}

function getCtpConfig(ctpProjectKey) {
  const ctpConfig = config.commercetools[ctpProjectKey]
  if (!ctpConfig)
    throw new Error(
      `Configuration is not provided. Please update the configuration. ctpProjectKey: [${ctpProjectKey}]`,
    )
  const result = {
    clientId: ctpConfig.clientId,
    clientSecret: ctpConfig.clientSecret,
    projectKey: ctpProjectKey,
    apiUrl:
      ctpConfig.apiUrl || 'https://api.europe-west1.gcp.commercetools.com',
    authUrl:
      ctpConfig.authUrl || 'https://auth.europe-west1.gcp.commercetools.com',
  }
  if (ctpConfig.authentication) {
    result.authentication = {
      scheme: ctpConfig.authentication.scheme,
      username: ctpConfig.authentication.username,
      password: ctpConfig.authentication.password,
    }
  }
  return result
}

function getnovalnetConfig(novalnetMerchantAccount) {
  const novalnetConfig = config.novalnet[novalnetMerchantAccount]
  if (!novalnetConfig)
    throw new Error(
      `Configuration for novalnetMerchantAccount is not provided. Please update the configuration: ${JSON.stringify(
        novalnetMerchantAccount,
      )}`,
    )
  return {
    apiKey: novalnetConfig.apiKey,
    apiBaseUrl: novalnetConfig.apiBaseUrl || 'https://checkout-test.novalnet.com/v71',
    clientKey: novalnetConfig.clientKey || '', // used only for development purpose,
    paypalMerchantId: novalnetConfig.paypalMerchantId || '', // used only for development purpose
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
    const errorMessage = _validateAuthenticationConfig(ctpConfig)
    if (errorMessage) {
      throw new Error(
        `Authentication is not properly configured. Please update the configuration. error : [${errorMessage}] 
        ctpProjectKey: [${ctpProjectKey}]`,
      )
    }
  }
}

loadAndValidateConfig()

export default {
  getModuleConfig,
  getCtpConfig,
  getnovalnetConfig,
  getAllCtpProjectKeys,
  getAllnovalnetMerchantAccounts,
  getnovalnetPaymentMethodsToNames,
}
