import InitSessionFormPage from './InitSessionFormPage.js'

export default class KlarnaInitSessionFormPage extends InitSessionFormPage {
  async initPaymentSession({ clientKey, paymentAfterCreateSession }) {
    await super.initPaymentSession(clientKey, paymentAfterCreateSession)
    await this.page.waitForSelector('.novalnet-checkout__button--pay')
    await this.page.click('.novalnet-checkout__button--pay')
  }
}
