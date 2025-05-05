export default class MakePaymentFormPage {
  constructor(page, baseUrl) {
    this.page = page
    this.baseUrl = baseUrl
  }

  async goToThisPage() {
    await this.page.goto(`${this.baseUrl}/make-payment-form`)
  }

  async generatenovalnetMakePaymentForm(clientKey) {
    await this.page.waitForSelector('#novalnet-client-key')

    // Put novalnet API Key into HTML for e2e test

    await this.page.type('#novalnet-client-key', clientKey)
    await this.page.$eval('#novalnet-client-key', (e) => e.blur())
  }

  async getMakePaymentRequestTextAreaValue() {
    await this.page.waitForSelector('.novalnet-checkout__button--pay')
    await this.page.click('.novalnet-checkout__button--pay')

    const makePaymentRequestTextArea = await this.page.$(
      '#novalnet-make-payment-request',
    )
    return (
      await makePaymentRequestTextArea.getProperty('innerHTML')
    ).jsonValue()
  }
}
