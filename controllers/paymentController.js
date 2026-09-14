// controllers/paymentController.js
import { createPayFastPayment } from '../services/payfastService.js';

export const initiatePayment = (req, res) => {
    try {
        const { orderNumber, totalAmount, customerName, customerEmail } = req.body;

        if (!orderNumber || !totalAmount || !customerName || !customerEmail) {
            return res.status(400).json({ success: false, error: 'Missing required payment details.' });
        }

        // Here, you should ideally verify the order amount against your database
        // to prevent fraud.

        const { payfastUrl, paymentData } = createPayFastPayment({
            orderNumber,
            totalAmount,
            customerName,
            customerEmail,
        });

        res.json({
            success: true,
            data: {
                payfastUrl,
                paymentData,
            },
        });
    } catch (error) {
        console.error('Payment initiation error:', error);
        res.status(500).json({ success: false, error: 'Failed to initiate payment.' });
    }
};