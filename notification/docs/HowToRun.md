# Deployment Guide

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Environment variable](#environment-variable)
  - [Preparing the credentials](#preparing-the-credentials)
  - [Required attributes](#required-attributes)
  - [Optional attributes](#optional-attributes)
  - [Standalone Optional Attributes](#standalone-optional-attributes)
  - [External file configuration](#external-file-configuration)
- [Commercetools project requirements](#commercetools-project-requirements)
- [Running](#running)
  - [Docker](#docker)
    - [Running the Docker image](#running-the-docker-image)
- [Deployment](#deployment)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Environment variable

Notification module requires 1 environment variable to start. This environment variable name
is `novalnet_INTEGRATION_CONFIG` and it must contain settings as attributes in a JSON structure.

```
{
  "commercetools": {
    "commercetoolsProjectKey1": {
      "clientId": "xxx",
      "clientSecret": "xxx"
    },
    "commercetoolsProjectKey2": {
      "clientId": "xxx",
      "clientSecret": "xxx"
    }
  },
  "novalnet": {
    "novalnetMerchantAccount1": {
      "enableHmacSignature": "false"
    },
    "novalnetMerchantAccount2": {
      "enableHmacSignature": "true",
      "secretHmacKey": "secretKey"
    }
  },
  "port": 8081
}
```

`novalnet_INTEGRATION_CONFIG` JSON structure contains different `attribute groups and optional attributes` as described below:

- `novalnet` attribute group: Multiple child attributes can be provided in the `novalnet` attribute. Each direct child attribute must represent an novalnet merchant account.
- `commercetools` attribute group: Multiple child attributes can be provided in the `commercetools` attribute. Each direct child attribute must represent a commercetools project.
- `standalone optional attributes` : Standalone attributes can be set as direct child attributes in `the root of the JSON`.

#### Preparing the credentials

- commercetools project credentials:
  - If you don't have the commercetools OAuth credentials,[create a commercetools API Client](https://docs.commercetools.com/getting-started.html#create-an-api-client).
    - Note that extension module requires `manage_payments` [scopes](https://docs.commercetools.com/http-api-scopes) for the integration and `manage_types` [scopes](https://docs.commercetools.com/http-api-scopes) for setting up required resources.

### Required attributes

| Group           | Name           | Content                                                      |
| --------------- | -------------- | ------------------------------------------------------------ |
| `commercetools` | `clientId`     | OAuth 2.0 `client_id` and can be used to obtain a token.     |
| `commercetools` | `clientSecret` | OAuth 2.0 `client_secret` and can be used to obtain a token. |

### Optional attributes

| Group           | Name                         | Content                                                                                                                                                                                                                   | Default value                                                                                         |
| --------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `novalnet`         | `enableHmacSignature`        | Verify the integrity of notifications using [novalnet HMAC signatures](https://docs.novalnet.com/development-resources/webhooks/verify-hmac-signatures). (⚠️ If deploying in Connect, it is required to set the field to false) | true                                                                                                  |
| `novalnet`         | `secretHmacKey`              | The generated secret HMAC key that is linked to a novalnet **Standard Notification** endpoint                                                                                                                                |                                                                                                       |
| `novalnet`         | `notificationBaseUrl`        | Publicly available URL of the Notification module. In case of any payment changes, novalnet will call this URL and pass the notification in body. This attribute is used when calling `npm run setup-resources`              |                                                                                                       |
| `novalnet`         | `apiKey`                     | This key will be used to make authenticated API requests to novalnet. This attribute is used when calling `npm run setup-resources`                                                                                          |                                                                                                       |
| `commercetools` | `apiUrl`                     | The commercetools HTTP API is hosted at that URL.                                                                                                                                                                         | `https://api.europe-west1.gcp.commercetools.com`                                                      |
| `commercetools` | `authUrl`                    | The commercetools’ OAuth 2.0 service is hosted at that URL.                                                                                                                                                               | `https://auth.europe-west1.gcp.commercetools.com`                                                     |
| /               | `novalnetPaymentMethodsToNames` | Key-value object where key is `paymentMethod` returned in the notification and value is the custom localized name that will be saved in CTP `payment.paymentMethodInfo.method`.                                           | `{scheme: {en: 'Credit Card'}, pp: {en: 'PayPal'}, klarna: {en: 'Klarna'}, gpay: {en: 'Google Pay'}}` |
| /               | `removeSensitiveData`        | Boolean attribute. When set to "false", novalnet fields with additional information about the payment will be saved in the interface interaction and in the custom fields.                                                   | true                                                                                                  |
| /               | `port`                       | The port number on which the application will run. (⚠️ If deploying in Connect, it is required to set the field to 8080)                                                                                                  | 443                                                                                                   |
| /               | `logLevel`                   | The log level (`trace`, `debug`, `info`, `warn`, `error`, `fatal`).                                                                                                                                                       | `info`                                                                                                |
| /               | `keepAliveTimeout`           | Milliseconds to keep a socket alive after the last response ([Node.js docs](https://nodejs.org/dist/latest/docs/api/http.html#http_server_keepalivetimeout)).                                                             | Node.js default (5 seconds)                                                                           |

### Standalone Optional Attributes

`Standalone optional attributes` should be set as direct child attributes in `novalnet_INTEGRATION_CONFIG`, as displayed below:

```
{
  "commercetools": {...},
  "novalnet": {...},
  "getnovalnetPaymentMethodsToNames": {
    "visa": {"en": "Credit card visa"},
    "gpay": {"en": "Google Pay"}
  },
  "logLevel": "DEBUG",
  "port": 8080,
  "keepAliveTimeout": 10000,
  "removeSensitiveData": false
}
```

### External file configuration

In case you have a huge configuration that reaches above the environment limits (e.g the total size of all environment variables on AWS Lambda can't exceed 4 KB.), you could use the external file configuration instead of setting `novalnet_INTEGRATION_CONFIG` environment variable. The notification module will look for the `.notificationrc` file in the `notification` folder. The file should contain the same JSON content as it's defined with environment variable.

## Commercetools project requirements

Resources below are required for the notification module to operate correctly.

1. [Payment-interface-interaction custom type](../resources/payment-interface-interaction-type.json)

You can create these by running the command `npm run setup-resources` as below, the command requires the `novalnet_INTEGRATION_CONFIG` to be set as an environment variable. Be aware that this command also sets up [the notification webhook in novalnet](./IntegrationGuide.md#step-1-set-up-notification-webhook-and-generate-hmac-signature).

```bash
export novalnet_INTEGRATION_CONFIG=xxxx
npm run setup-resources
```

## Running

### Docker

Refer to our [docker hub](https://hub.docker.com/r/commercetools/commercetools-novalnet-integration-notification/tags) page
to see the latest releases and tags.

#### Running the Docker image

```bash
    docker run \
    -e novalnet_INTEGRATION_CONFIG=xxxxxx \
    commercetools/commercetools-novalnet-integration-notification:vX.X.X
```

## Deployment

Notification module supports different deployment [options](/deployment-examples). It could be either hosted
on-premises (run docker containers behind the load balancer) or deployed as a serverless application.
