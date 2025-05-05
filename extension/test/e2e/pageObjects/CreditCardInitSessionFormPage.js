import { executeInnovalnetIframe } from '../e2e-test-utils.js'
import InitSessionFormPage from './InitSessionFormPage.js'

export default class CreditCardInitSessionFormPage extends InitSessionFormPage {
  async initPaymentSession({
    clientKey,
    paymentAfterCreateSession,
    creditCardNumber,
    creditCardDate,
    creditCardCvc,
  }) {
    await super.initPaymentSession(clientKey, paymentAfterCreateSession)
    await this.pasteValuesInCreditCardWebComponent(
      creditCardNumber,
      creditCardDate,
      creditCardCvc,
    )
    await this.confirmCreditCardWebComopnent()
  }

  async pasteValuesInCreditCardWebComponent(
    creditCardNumber,
    creditCardDate,
    creditCardCvc,
  ) {
    const elementHandle = await this.page.waitForSelector(
      '[data-cse="encryptedCardNumber"] iframe',
    )
    const encryptedCardNumberFrame = await elementHandle.contentFrame()
    await encryptedCardNumberFrame.waitForNavigation({
      waitUntil: 'domcontentloaded',
    })

    // For some reason following selector won't work unless we wait
    await encryptedCardNumberFrame.waitForSelector(
      '[data-fieldtype="encryptedCardNumber"]',
      { timeout: 10000 },
    )

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
  }

  async confirmCreditCardWebComopnent() {
    await this.page.waitForSelector('.novalnet-checkout__button--pay', {
      timeout: 3000,
    })
    const checkoutButton = await this.page.$('.novalnet-checkout__button--pay')

    await this.page.evaluate((cb) => cb.click(), checkoutButton)
  }

  async getPaymentAuthResult() {
    const authResultEle = await this.page.$('#novalnet-payment-auth-result')
    await new Promise((resolve) => {
      setTimeout(resolve, 2000)
    })
    const authResultJson = await (
      await authResultEle.getProperty('innerHTML')
    ).jsonValue()

    return authResultJson
  }
}
