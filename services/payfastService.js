// services/payfastService.js
import crypto from 'crypto';

const PAYFAST_PROCESS_URL = process.env.PAYFAST_SANDBOX === 'true'
    ? 'https://sandbox.payfast.co.za/eng/process'
    : 'https://www.payfast.co.za/eng/process';

/**
 * Generates a signature for PayFast payment request.
 * @param {Object} data - The payment data object.
 * @param {string} passphrase - Your PayFast passphrase.
 * @returns {string} The MD5 signature.
 */
const generateSignature = (data, passphrase) => {
    // 1. Create a query string from the data, excluding empty values.
    // The order must match the PayFast documentation exactly.
    const orderedKeys = [
        'merchant_id', 'merchant_key', 'return_url', 'cancel_url', 'notify_url',
        'name_first', 'name_last', 'email_address', 'm_payment_id', 'amount',
        'item_name', 'item_description', 'custom_int1', 'custom_str1'
    ];

    const paramString = orderedKeys
        .filter(key => data[key] !== undefined && data[key] !== '')
        .map(key => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}`)
        .join('&');

    // 2. Append the passphrase if it exists.
    // Even if empty, the '&passphrase=' is still part of the string.
    const stringToHash = `${paramString}&passphrase=${encodeURIComponent(passphrase || '').replace(/%20/g, '+')}`;

    // 3. Generate the MD5 hash.
    return crypto.createHash('md5').update(stringToHash).digest('hex');
};

/**
 * Generates the full payment data object and URL for PayFast.
 * @param {Object} orderData - The order details from your database.
 * @returns {Object} Contains the paymentData object and the action URL.
 */
export const createPayFastPayment = (orderData) => {
    const { orderNumber, totalAmount, customerName, customerEmail } = orderData;

    // Split the name for PayFast's first/last name fields.
    const nameParts = customerName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const paymentData = {
        merchant_id: process.env.PAYFAST_MERCHANT_ID,
        merchant_key: process.env.PAYFAST_MERCHANT_KEY,
        return_url: process.env.PAYFAST_RETURN_URL,
        cancel_url: process.env.PAYFAST_CANCEL_URL,
        notify_url: process.env.PAYFAST_NOTIFY_URL,
        name_first: firstName,
        name_last: lastName,
        email_address: customerEmail,
        m_payment_id: orderNumber, 
        amount: parseFloat(totalAmount).toFixed(2),
        item_name: `LocalCart Order #${orderNumber}`,
        item_description: `Payment for order #${orderNumber}`,
    };

    // Generate the signature using the payment data and your passphrase.
    paymentData.signature = generateSignature(paymentData, process.env.PAYFAST_PASSPHRASE);

    return {
        payfastUrl: PAYFAST_PROCESS_URL,
        paymentData: paymentData,
    };
};