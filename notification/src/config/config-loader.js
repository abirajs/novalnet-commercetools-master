import rc from 'rc'

function loadConfig() {
  if (process.env.novalnet_INTEGRATION_CONFIG) {
    return loadFromnovalnetIntegrationEnvVar()
  }

  return loadFromExternalFile()
}

function loadFromnovalnetIntegrationEnvVar() {
  try {
    return JSON.parse(process.env.novalnet_INTEGRATION_CONFIG)
    // eslint-disable-next-line no-unused-vars
  } catch (e) {
    throw new Error(
      'novalnet integration configuration is not provided in the JSON format',
    )
  }
}

function loadFromExternalFile() {
  /*
  see: https://github.com/dominictarr/rc#standards for file precedence.
   */
  const appName = 'notification'
  const configFromExternalFile = rc(appName)
  const hasConfig = configFromExternalFile?.configs?.length > 0
  if (!hasConfig) {
    throw new Error('novalnet integration configuration is not provided.')
  }
  return configFromExternalFile
}

export { loadConfig }
