// SMS templates
export function getOrderSMS(orderNumber, status) {
    const messages = {
        'confirmed': `✅ Order #${orderNumber} confirmed! We'll let you know when it ships. - LocalCart`,
        'shipped': `🚚 Order #${orderNumber} is on the way! Track your delivery. - LocalCart`,
        'delivered': `🎉 Order #${orderNumber} delivered! Enjoy your LocalCart goodies!`,
        'cancelled': `❌ Order #${orderNumber} has been cancelled.`
    };
    return messages[status] || `📦 Order #${orderNumber} status: ${status}`;
}

export function getVendorAlertSMS(orderNumber) {
    return `🛍️ New order #${orderNumber} received! Check your vendor dashboard. - LocalCart`;
}

export function getCollectionCodeSMS(orderNumber, code) {
    return `📦 Order #${orderNumber} ready for collection! Use code: ${code} - LocalCart`;
}

// Format phone number to international format
export function formatPhoneNumber(phone) {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If it starts with 0, replace with +27
    if (cleaned.startsWith('0')) {
        cleaned = '27' + cleaned.substring(1);
    }
    
    // If it doesn't have +, add it
    if (!cleaned.startsWith('+')) {
        cleaned = '+' + cleaned;
    }
    
    return cleaned;
}