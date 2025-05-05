import { pasteValue } from '../e2e-test-utils.js'

export default class RedirectPaymentFormPage {
  constructor(page, baseUrl) {
    this.page = page
    this.baseUrl = baseUrl
  }

  async goToThisPage() {
    await this.page.goto(`${this.baseUrl}/redirect-payment-form`)
  }

  async redirectTonovalnetPaymentPage(novalnetClientKey, sessionId, redirectResult) {
    await this.page.waitForSelector('#novalnet-client-key')
    await pasteValue(this.page, '#novalnet-client-key', novalnetClientKey)
    await pasteValue(this.page, '#novalnet-redirect-session-id', sessionId)
    await pasteValue(this.page, '#novalnet-redirect-result', redirectResult)

    await this.page.click('#redirect-payment-button')
    await new Promise((resolve) => {
      setTimeout(resolve, 3000)
    })
    const redirectResultCodeEle = await this.page.$(
      '#novalnet-payment-auth-result',
    )
    return await this.page.evaluate((el) => el.value, redirectResultCodeEle)
  }
}
