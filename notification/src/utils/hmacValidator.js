import { hmacValidator } from '@novalnet/api-library'
import config from '../config/config.js'

const validator = new hmacValidator()

function validateHmacSignature(notification) {
  /* By verifying this (hmacSignature) signature, We confirm that the notification was sent by novalnet,
  and was not modified during transmission.
  A sample representation will look like:
  {
     "NotificationRequestItem":{
        "additionalData":{
           "hmacSignature":"+JWKfq4ynALK+FFzGgHnp1jSMQJMBJeb87dlph24sXw="
        },
      ...
     }
  }
  */
  const notificationRequestItem = notification.NotificationRequestItem
  if (!notificationRequestItem.additionalData)
    return (
      'Notification does not contain the required field ' +
      '"NotificationRequestItem.additionalData". Please check if HMAC is configured correctly or contact novalnet.'
    )
  if (!notificationRequestItem.additionalData.hmacSignature)
    return (
      'Notification does not contain the required field ' +
      '"NotificationRequestItem.additionalData.hmacSignature". ' +
      'Please check if HMAC is configured correctly or contact novalnet.'
    )
  const novalnetMerchantAccount =
    notification.NotificationRequestItem.merchantAccountCode
  const novalnetConfig = config.getnovalnetConfig(novalnetMerchantAccount)
  const validationResult = validator.validateHMAC(
    notificationRequestItem,
    novalnetConfig.secretHmacKey,
  )
  if (!validationResult)
    return (
      'Notification does not have a valid HMAC signature, ' +
      'please confirm that the notification was sent by novalnet, ' +
      'and was not modified during transmission.'
    )
  return null
}

export { validateHmacSignature }
