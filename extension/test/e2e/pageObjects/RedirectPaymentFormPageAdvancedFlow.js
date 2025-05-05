import { pasteValue } from '../e2e-test-utils.js'
import httpUtils from '../../../src/utils.js'

const logger = httpUtils.getLogger()

export default class RedirectPaymentFormPageAdvancedFlow {
  constructor(page, baseUrl) {
    this.page = page
    this.baseUrl = baseUrl
  }

  async goToThisPage() {
    await this.page.goto(`${this.baseUrl}/redirect-payment-form`)
  }

  async redirectTonovalnetPaymentPage(paymentDetailsResponse, clientKey) {
    logger.debug(
      'redirectTonovalnetPaymentPage::paymentDetailsResponse::',
      paymentDetailsResponse,
    )
    await pasteValue(
      this.page,
      '#novalnet-make-payment-response-action-field',
      JSON.stringify(paymentDetailsResponse.action),
    )

    await pasteValue(this.page, '#novalnet-client-key', clientKey)
    return this.page.click('#redirect-payment-button')
  }
}
