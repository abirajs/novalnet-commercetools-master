import { executeInnovalnetIframe } from '../e2e-test-utils.js'

export default class CreditCard3dsNativePage {
  constructor(page, baseUrl) {
    this.page = page
    this.baseUrl = baseUrl
  }

  async finish3dsNativePayment() {
    await executeInnovalnetIframe(this.page, '[name=answer]', (el) =>
      el.type('password'),
    )
    await executeInnovalnetIframe(this.page, 'button[type=submit]', (el, frame) =>
      frame.$eval('#buttonSubmit', async (button) => {
        await button.click()
      }),
    )

    await new Promise((resolve) => {
      setTimeout(resolve, 1000)
    })

    const additionalPaymentDetailsInput2 = await this.page.$(
      '#novalnet-additional-payment-details',
    )
    return this.page.evaluate((el) => el.value, additionalPaymentDetailsInput2)
  }
}
