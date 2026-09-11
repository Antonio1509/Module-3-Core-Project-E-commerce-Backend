/* =========================================================
   LocalCart — services/sms.js
   Wraps Twilio so the rest of the app just calls a plain
   function. If Twilio credentials aren't set in .env (e.g.
   while developing locally), messages are logged to the
   console instead of failing the whole request.
   ========================================================= */

require("dotenv").config();

const hasTwilioConfig =
  process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER;

const client = hasTwilioConfig
  ? require("twilio")(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

/**
 * Generic sender used internally by every helper below.
 * South African numbers stored as 08xxxxxxxx are converted
 * to the +27 international format Twilio requires.
 */
function toInternational(phone) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return "+27" + digits.slice(1);
  if (digits.startsWith("27")) return "+" + digits;
  return phone;
}

async function sendSMS(to, body) {
  const formattedTo = toInternational(to);

  if (!client) {
    console.log(`📱 [DEV MODE — no Twilio credentials set] SMS to ${formattedTo}: "${body}"`);
    return { success: true, dev: true };
  }

  try {
    const message = await client.messages.create({
      to: formattedTo,
      from: process.env.TWILIO_FROM_NUMBER,
      body
    });
    console.log(`📱 SMS sent to ${formattedTo}: ${message.sid}`);
    return { success: true, sid: message.sid };
  } catch (err) {
    console.error(`❌ SMS to ${formattedTo} failed:`, err.message);
    return { success: false, error: err.message };
  }
}

/** Sent once a vendor successfully registers. */
function sendVendorWelcomeSMS(vendor) {
  return sendSMS(
    vendor.phone,
    `Hi ${vendor.name}! Your LocalCart storefront was created and is pending review. We'll text you once it's live.`
  );
}

/** Sent when a vendor's storefront is approved. */
function sendVendorApprovedSMS(vendor) {
  return sendSMS(
    vendor.phone,
    `Good news, ${vendor.name}! Your LocalCart storefront is now live and visible to customers.`
  );
}

/** Sent to a vendor the moment a new order comes in — SMS is faster than email for this. */
function sendOrderAlertSMS(vendor, order) {
  return sendSMS(
    vendor.phone,
    `New LocalCart order #${order.id} for R${order.total}. Check your dashboard for details.`
  );
}

module.exports = {
  sendSMS,
  sendVendorWelcomeSMS,
  sendVendorApprovedSMS,
  sendOrderAlertSMS
};