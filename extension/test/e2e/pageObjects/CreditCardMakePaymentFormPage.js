import { executeInnovalnetIframe } from '../e2e-test-utils.js'
import MakePaymentFormPage from './MakePaymentFormPage.js'

export default class CreditCardMakePaymentFormPage extends MakePaymentFormPage {
  async getMakePaymentRequest({
    creditCardNumber,
    creditCardDate,
    creditCardCvc,
    clientKey,
  }) {
    await this.generatenovalnetMakePaymentForm(clientKey)

    await new Promise((resolve) => {
      setTimeout(resolve, 2000)
    }) // wait for web component rendering

    await executeInnovalnetIframe(
      this.page,
      '[data-fieldtype=encryptedCardNumber]',
      (el) => el.type(creditCardNumber),
    )
    await executeInnovalnetIframe(
      this.page,
      'input[data-fieldtype^=encryptedExpiry]',
      (el) => el.type(creditCardDate),
    )
    await executeInnovalnetIframe(
      this.page,
      'input[data-fieldtype^=encryptedSecurity]',
      (el) => el.type(creditCardCvc),
    )

    return this.getMakePaymentRequestTextAreaValue()
  }
}
