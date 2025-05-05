import InitSessionFormPage from './InitSessionFormPage.js'

export default class AffirmInitSessionFormPage extends InitSessionFormPage {
  async initPaymentSession({ clientKey, paymentAfterCreateSession }) {
    await super.initPaymentSession(clientKey, paymentAfterCreateSession)
    await this.pasteValuesInAffirmWebComponent()
    await this.confirmAffirmWebComponent()
  }

  async pasteValuesInAffirmWebComponent() {
    await this.page.waitForSelector('.novalnet-checkout__button--pay') // wait for rendering of web component

    const novalnetCheckoutInputFormElement = await this.page.$(
      '#novalnet-payment-form-input',
    )

    const novalnetCheckoutInputForm = await (
      await novalnetCheckoutInputFormElement.getProperty('innerHTML')
    ).jsonValue()
    const novalnetCheckoutInputFormJSON = JSON.parse(
      novalnetCheckoutInputForm.toString(),
    )

    await this.page.type(
      '.novalnet-checkout__input--firstName',
      novalnetCheckoutInputFormJSON?.shopperName?.firstName,
    )

    await this.page.type(
      '.novalnet-checkout__input--lastName',
      novalnetCheckoutInputFormJSON?.shopperName?.lastName,
    )

    await this.page.type(
      '.novalnet-checkout__input--shopperEmail',
      novalnetCheckoutInputFormJSON?.shopperEmail,
    )

    await this.page.type(
      '.novalnet-checkout__input--telephoneNumber',
      novalnetCheckoutInputFormJSON?.telephoneNumber,
    )

    await this.page.type(
      '.novalnet-checkout__input--street',
      novalnetCheckoutInputFormJSON?.billingAddress?.street,
    )

    await this.page.type(
      '.novalnet-checkout__input--houseNumberOrName',
      novalnetCheckoutInputFormJSON?.billingAddress?.houseNumberOrName,
    )

    await this.page.type(
      '.novalnet-checkout__input--city',
      novalnetCheckoutInputFormJSON?.billingAddress?.city,
    )
    await this.page.type(
      '.novalnet-checkout__input--postalCode',
      novalnetCheckoutInputFormJSON?.billingAddress?.postalCode,
    )
    await this.fillDeliveryAddressStateDDL(
      novalnetCheckoutInputFormJSON?.billingAddress?.stateCode,
    )
  }

  async fillDeliveryAddressStateDDL(stateCodeInput) {
    const deliveryAddressStateElemList = await this.page.$$(
      '.novalnet-checkout__dropdown__list',
    )
    const deliveryAddressStateElem = deliveryAddressStateElemList[1]
    const deliveryAddressStateOptions = await deliveryAddressStateElem.$$(
      '.novalnet-checkout__dropdown__element',
    )
    deliveryAddressStateOptions.map(async (el) => {
      // const elem = e1
      await el.evaluate((item, selectedStateCode) => {
        const stateCode = item.getAttribute('data-value')
        if (stateCode === selectedStateCode) item.click()
      }, stateCodeInput)
    })
  }

  async confirmAffirmWebComponent() {
    await new Promise((resolve) => {
      setTimeout(resolve, 2000)
    }) // wait for the form has been filled before checkout
    const checkoutButton = await this.page.$('.novalnet-checkout__button--pay')
    await this.page.evaluate((cb) => cb.click(), checkoutButton)
  }
}
