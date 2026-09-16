import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ============================================================
// SMTP TRANSPORTER
// ============================================================
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465, // true only for port 465
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

async function sendMail({ to, subject, html }) {
    try {
        const info = await transporter.sendMail({
            from: `"LocalCart" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html
        });
        console.log(` Email sent to ${to}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (err) {
        console.error(` Email to ${to} failed:`, err.message);
        return { success: false, error: err.message };
    }
}

// ============================================================
// VENDOR EMAILS
// ============================================================

/** Sent once a vendor successfully registers (status = pending). */
export function sendVendorWelcomeEmail(vendor) {
    return sendMail({
        to: vendor.email,
        subject: "Welcome to LocalCart — your storefront is pending review",
        html: `
            <h2>Hi ${vendor.name},</h2>
            <p>Thanks for registering as a vendor on LocalCart! Your storefront has been created
            and is currently <strong>pending approval</strong> from our team.</p>
            <p>We'll email you again as soon as it's live and customers can start browsing your products.</p>
            <p>— The LocalCart Team</p>
        `
    });
}

/** Sent by an admin action when a vendor's storefront is approved. */
export function sendVendorApprovedEmail(vendor) {
    return sendMail({
        to: vendor.email,
        subject: "Your LocalCart storefront is live! ",
        html: `
            <h2>Congratulations, ${vendor.name}!</h2>
            <p>Your storefront has been approved and is now visible in the LocalCart vendor directory.</p>
            <p>Log in to your dashboard to start adding products, if you haven't already.</p>
            <p>— The LocalCart Team</p>
        `
    });
}

// ============================================================
// CUSTOMER EMAILS
// ============================================================

/** Sent when a customer uses the "Contact vendor" form on a storefront. */
export function sendCustomerInquiryEmail(vendor, customer) {
    return sendMail({
        to: vendor.email,
        subject: `New enquiry from ${customer.name} via LocalCart`,
        html: `
            <h2>You've got a new message</h2>
            <p><strong>From:</strong> ${customer.name} (${customer.email})</p>
            <p><strong>Message:</strong></p>
            <p>${customer.message}</p>
            <p style="color:#888;font-size:12px;">Reply directly to this email to respond to the customer.</p>
        `
    });
}

// ============================================================
// ORDER EMAILS
// ============================================================

/** Sent to a vendor when a new order is placed for one of their products. */
export function sendOrderNotificationEmail(vendor, order) {
    return sendMail({
        to: vendor.email,
        subject: `New order #${order.id} — LocalCart`,
        html: `
            <h2>New order received</h2>
            <p><strong>Order #:</strong> ${order.id}</p>
            <p><strong>Product(s):</strong> ${order.items}</p>
            <p><strong>Total:</strong> R${order.total}</p>
            <p>Log in to your vendor dashboard to view full order details and mark it as fulfilled.</p>
        `
    });
}

// ============================================================
// DEFAULT EXPORT — bundled object, since some controllers
// import this service as `import emailService from '...'`
// ============================================================
export default {
    sendVendorWelcomeEmail,
    sendVendorApprovedEmail,
    sendCustomerInquiryEmail,
    sendOrderNotificationEmail
};