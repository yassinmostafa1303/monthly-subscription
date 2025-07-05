/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Defines the base request configuration for Google Pay API interactions.
 * This configuration is used to create a Google Payments Client and to
 * specify the allowed payment methods and merchant information.
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/request-objects}
 */
const merchantInfo = {
    // TODO: Replace with your actual Google Pay merchant ID
    merchantId: 'BCR2DN4T26363CST',
    // TODO: Replace with your actual merchant name
    merchantName: 'Yassin',
};

/**
 * @constant {object} baseRequest
 * Base configuration for Google Pay API requests.
 * Contains essential properties such as API version, allowed payment methods,
 * and merchant information. This object serves as a template for creating
 * specific payment requests.
 */
const baseGooglePayRequest = {
    apiVersion: 2,
    apiVersionMinor: 0,
    allowedPaymentMethods: [
        {
            type: "CARD",
            parameters: {
                allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
                allowedCardNetworks: ["AMEX", "DISCOVER", "INTERAC", "JCB", "MASTERCARD", "VISA"]
            },
            tokenizationSpecification: {
                type: "PAYMENT_GATEWAY",
                parameters: {
                    // TODO: Replace with your actual payment gateway
                    gateway: "example",
                    // TODO: Replace with your actual gateway merchant ID
                    gatewayMerchantId: "exampleGatewayMerchantId"
                }
            }
        }
    ],
    merchantInfo
};

Object.freeze(baseGooglePayRequest);

let paymentsClient = null;

/**
 * Returns a Google Pay API client instance.
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/client#PaymentsClient}
 * @return {google.payments.api.PaymentsClient} Google Payments Client instance.
 */
function getGooglePaymentsClient() {
    if (paymentsClient === null) {
        paymentsClient = new google.payments.api.PaymentsClient({
            environment: 'TEST', // Change to 'PRODUCTION' for production
            merchantInfo,
        });
    }
    return paymentsClient;
}

/**
 * Initialize Google Pay buttons.
 * Find all elements with the class 'google-pay-button' and render Google Pay buttons within them.
 */
function initializeGooglePayButtons() {
    const buttons = document.querySelectorAll('.google-pay-button');
    buttons.forEach(buttonContainer => {
        const price = buttonContainer.dataset.price;
        const description = buttonContainer.dataset.description;

        const button = getGooglePaymentsClient().createButton({
            onClick: () => onGooglePaymentButtonClicked(price, description)
        });

        // Clear existing content and append the Google Pay button
        buttonContainer.innerHTML = '';
        buttonContainer.appendChild(button);
    });
}


/**
 * Handles the case where the Google Pay API script has loaded.
 * Checks if the user is ready to pay with Google Pay.
 * @see {@link https://developers.google.com/pay/api/web/reference/client#isReadyToPay}
 */
function onGooglePayLoaded() {
    const req = deepCopy(baseGooglePayRequest);
    getGooglePaymentsClient()
        // Check if the user is ready to pay with Google Pay.
        .isReadyToPay(req)
        // Handle the response from the isReadyToPay() method.
        .then(function (res) {
            // If the user is ready to pay with Google Pay...
            if (res.result) {
                initializeGooglePayButtons(); // Initialize buttons if ready
                console.log('Google Pay is ready to pay.');
            } else {
                // Optionally, hide or disable the buttons if not ready
                document.querySelectorAll('.google-pay-button').forEach(button => button.style.display = 'none');
                console.log('Google Pay is not ready to pay.');
            }
        })
        // Handle any errors that occur during the process.
        .catch(err => {
            console.error('Error checking isReadyToPay:', err);
        });
}

//=============================================================================
// Helpers
//=============================================================================

/**
 * Creates a deep copy of an object.
 *
 * This function uses JSON serialization and deserialization to create a deep
 * copy of the provided object. It\'s a convenient way to clone objects without
 * worrying about shared references.\n
 *
 * @param {Object} obj - The object to be copied.\n
 * @returns {Object} A deep copy of the original object.\n
 */
const deepCopy = obj => JSON.parse(JSON.stringify(obj));


//=============================================================================
// Event Handlers
//=============================================================================


/**
 * Google Pay button click handler
 * @param {string} price The price of the item to purchase.
 * @param {string} description A description of the item being purchased.
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/client#loadPaymentData}
 * @see {@link https://developers.google.com/pay/api/web/reference/response-objects#PaymentMethodTokenizationData}
 */
function onGooglePaymentButtonClicked(price, description) {
    const req = {
        ...deepCopy(baseGooglePayRequest),
        transactionInfo: {
            countryCode: 'US',
            currencyCode: 'USD',
            totalPriceStatus: 'FINAL',
            totalPriceLabel: description,
            totalPrice: price, // Use the price passed from the button
        },
    };

    console.log('onGooglePaymentButtonClicked', req);

    getGooglePaymentsClient()
        .loadPaymentData(req)
        .then(function (res) {
            // show returned data for debugging
            console.log(res);
            // TODO: Pass payment token to your gateway to process payment
            // @note DO NOT save the payment credentials for future transactions,
            // unless they\'re used for merchant-initiated transactions with user
            // consent in place.
            const paymentToken = res.paymentMethodData.tokenizationData.token;
            location.replace("./success.html")
            // Add your backend integration here to process the payment using the token
        })
        .catch(console.error);
}
