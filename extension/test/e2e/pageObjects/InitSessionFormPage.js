export default class InitSessionFormPage {
  constructor(page, baseUrl) {
    this.page = page
    this.baseUrl = baseUrl
  }

  async goToThisPage() {
    await this.page.goto(`${this.baseUrl}/init-session-form`)
  }

  async initPaymentSession(clientKey, payment) {
    const createSessionResponseStr =
      payment?.custom?.fields?.createSessionResponse
    const createSessionResponse = JSON.parse(createSessionResponseStr)

    await this.page.waitForSelector('#novalnet-client-key')

    // Put novalnet API Key into HTML for e2e test

    await this.page.type('#novalnet-client-key', clientKey)
    await this.page.$eval('#novalnet-client-key', (e) => e.blur())

    // Put Session ID into HTML for e2e test

    await this.page.type('#novalnet-session-id', createSessionResponse.id)
    await this.page.$eval('#novalnet-session-id', (e) => e.blur())

    // Put Session ID into HTML for e2e test

    await this.page.type(
      '#novalnet-session-data',
      createSessionResponse.sessionData,
    )
    await this.page.$eval('#novalnet-session-data', (e) => e.blur())
  }
}
