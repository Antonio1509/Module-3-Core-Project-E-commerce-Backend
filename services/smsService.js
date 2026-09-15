// Example using Twilio or Africa's Talking
import twilio from 'twilio';


const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;


const client = twilio(accountSid, authToken);


export async function sendOrderConfirmationSMS(phone, orderNumber) {
    try {
        await client.messages.create({
            body: ` Order #${orderNumber} confirmed! We'll notify you when it ships. - LocalCart`,
            from: twilioPhone,
            to: phone
        });
        return { success: true };
    } catch (error) {
        console.error('SMS error:', error);
        return { success: false, error: error.message };
    }
}


export async function sendDeliveryUpdateSMS(phone, orderNumber, status, collectionCode) {
    const messages = {
        'shipped': ` Order #${orderNumber} is on the way! Track your delivery. - LocalCart`,
        'delivered': ` Order #${orderNumber} delivered! Enjoy your LocalCart goodies! `,
        'at_rank': ` Order #${orderNumber} is ready for collection at the rank. Use code: ${collectionCode}`
    };


    try {
        await client.messages.create({
            body: messages[status] || ` Order #${orderNumber} status: ${status}`,
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
            body: ` New order #${orderNumber} received! Check your dashboard. - LocalCart`,
            from: twilioPhone,
            to: phone
        });
        return { success: true };
    } catch (error) {
        console.error('SMS error:', error);
        return { success: false, error: error.message };
    }
}

/** Sent once a vendor successfully registers (storefront pending review). */
export async function sendVendorWelcomeSMS(vendor) {
    if (!vendor?.phone) return { success: false, error: 'No phone number on file' };
    try {
        await client.messages.create({
            body: ` Welcome to LocalCart, ${vendor.name}! Your storefront is pending approval.`,
            from: twilioPhone,
            to: vendor.phone
        });
        return { success: true };
    } catch (error) {
        console.error('SMS error:', error);
        return { success: false, error: error.message };
    }
}

/** Sent when an admin approves a vendor's storefront. */
export async function sendVendorApprovedSMS(vendor) {
    if (!vendor?.phone) return { success: false, error: 'No phone number on file' };
    try {
        await client.messages.create({
            body: ` Great news ${vendor.name}! Your LocalCart storefront is now live.`,
            from: twilioPhone,
            to: vendor.phone
        });
        return { success: true };
    } catch (error) {
        console.error('SMS error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================
// DEFAULT EXPORT — bundled object, since some controllers
// import this service as `import sms from '...'`
// ============================================================
export default {
    sendOrderConfirmationSMS,
    sendDeliveryUpdateSMS,
    sendVendorAlertSMS,
    sendVendorWelcomeSMS,
    sendVendorApprovedSMS
};
