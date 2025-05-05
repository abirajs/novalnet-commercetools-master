process.env.novalnet_INTEGRATION_CONFIG = JSON.stringify({
  commercetools: {
    ctpProjectKey1: {
      clientId: 'clientId',
      clientSecret: 'clientSecret',
    },
    ctpProjectKey2: {
      clientId: 'clientId2',
      clientSecret: 'clientSecret2',
    },
    ctpProjectKey3: {
      clientId: 'clientId3',
      clientSecret: 'clientSecret3',
    },
  },
  novalnet: {
    novalnetMerchantAccount1: {
      apiKey: 'apiKey',
      clientKey: 'clientKey',
      enableHmacSignature: 'false',
      notificationBaseUrl: 'https://test-notification',
    },
    novalnetMerchantAccount2: {
      apiKey: 'apiKey2',
      clientKey: 'clientKey2',
      enableHmacSignature: 'false',
    },
  },
  logLevel: 'DEBUG',
})
