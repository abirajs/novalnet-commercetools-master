import {
  getAuthorizationTransactionSuccess,
  createAddInterfaceInteractionAction,
  getCancelAuthorizationTransactionInit,
  createChangeTransactionStateAction,
  createChangeTransactionInteractionId,
} from './payment-utils.js'
import { cancelPayment } from '../service/web-component-service.js'
import constants from '../config/constants.js'

const { CTP_INTERACTION_TYPE_CANCEL_PAYMENT } = constants

async function execute(paymentObject) {
  const authorizationTransaction =
    getAuthorizationTransactionSuccess(paymentObject)
  // "originalReference: The original pspReference of the payment that you want to cancel.
  // This reference is returned in the response to your payment request, and in the AUTHORISATION notification."
  const cancelRequestObj = {
    originalReference: authorizationTransaction.interactionId,
    reference: paymentObject.key,
  }
  const novalnetMerchantAccount = paymentObject.custom.fields.novalnetMerchantAccount
  const commercetoolsProjectKey =
    paymentObject.custom.fields.commercetoolsProjectKey

  const { request, response } = await cancelPayment(
    novalnetMerchantAccount,
    commercetoolsProjectKey,
    cancelRequestObj,
  )

  const addInterfaceInteractionAction = createAddInterfaceInteractionAction({
    request,
    response,
    type: CTP_INTERACTION_TYPE_CANCEL_PAYMENT,
  })

  const actions = [addInterfaceInteractionAction]
  if (!response.errorCode && response.pspReference)
    actions.push(
      ..._createTransactionActions(paymentObject, response.pspReference),
    )

  return { actions }
}

function _createTransactionActions(paymentObject, pspReference) {
  const cancelTransaction = getCancelAuthorizationTransactionInit(paymentObject)
  const transactionId = cancelTransaction.id

  return [
    createChangeTransactionStateAction(transactionId, 'Pending'),
    createChangeTransactionInteractionId(transactionId, pspReference),
  ]
}

export default { execute }
