import { disableStoredPayment } from '../service/web-component-service.js'
import {
  createAddInterfaceInteractionAction,
  createSetCustomFieldAction,
} from './payment-utils.js'
import c from '../config/constants.js'

async function execute(paymentObject) {
  const disableStoredPaymentRequestObj = JSON.parse(
    paymentObject.custom.fields.disableStoredPaymentRequest,
  )
  const novalnetMerchantAccount = paymentObject.custom.fields.novalnetMerchantAccount
  const { request, response } = await disableStoredPayment(
    novalnetMerchantAccount,
    disableStoredPaymentRequestObj,
  )

  return {
    actions: [
      createAddInterfaceInteractionAction({
        request,
        response,
        type: c.CTP_INTERACTION_TYPE_DISABLE_STORED_PAYMENT,
      }),
      createSetCustomFieldAction(
        c.CTP_DISABLE_STORED_PAYMENT_RESPONSE,
        response,
      ),
    ],
  }
}

export default { execute }
