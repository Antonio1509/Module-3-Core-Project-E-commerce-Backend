// Example using Twilio or Africa's Talking
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

export async function sendOrderConfirmationSMS(phone, orderNumber) {
    try {
        await client.messages.create({
            body: `📦 Order #${orderNumber} confirmed! We'll notify you when it ships. - LocalCart`,
            from: twilioPhone,
            to: phone
        });
        return { success: true };
    } catch (error) {
        console.error('SMS error:', error);
        return { success: false, error: error.message };
    }
}

export async function sendDeliveryUpdateSMS(phone, orderNumber, status) {
    const messages = {
        'shipped': `🚚 Order #${orderNumber} is on the way! Track your delivery. - LocalCart`,
        'delivered': `✅ Order #${orderNumber} delivered! Enjoy your LocalCart goodies! 🎉`,
        'at_rank': `📍 Order #${orderNumber} is ready for collection at the rank. Use code: ${collectionCode}`
    };

    try {
        await client.messages.create({
            body: messages[status] || `📦 Order #${orderNumber} status: ${status}`,
            from: twilioPhone,
            to: phone
        });
        return { success: true };
    } catch (error) {
        console.error('SMS error:', error);
        return { success: false, error: error.message };
    }
}

export async function sendVendorAlertSMS(phone, orderNumber) {
    try {
        await client.messages.create({
            body: `🛍️ New order #${orderNumber} received! Check your dashboard. - LocalCart`,
            from: twilioPhone,
            to: phone
        });
        return { success: true };
    } catch (error) {
        console.error('SMS error:', error);
        return { success: false, error: error.message };
    }
}