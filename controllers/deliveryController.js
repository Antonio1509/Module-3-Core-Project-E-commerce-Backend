import DeliveryMethod from '../models/DeliveryMethod.js';


// @desc    Get all delivery methods
// @route   GET /api/delivery/methods
// @access  Public
export const getDeliveryMethods = async (req, res) => {
  try {
    const methods = await DeliveryMethod.findAll();
    res.json(methods);
  } catch (error) {
    console.error('getDeliveryMethods error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// @desc    Preview the order summary with a delivery method applied
// @route   POST /api/delivery/preview
// @access  Public (cart is anonymous until checkout)
// Body: { items: [{ price, quantity }], methodCode: 'rankdrop' }
export const previewDelivery = async (req, res) => {
  try {
    const { items = [], methodCode } = req.body;


    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'items array is required' });
    }
    if (!methodCode) {
      return res.status(400).json({ message: 'methodCode is required' });
    }


    const method = await DeliveryMethod.findByCode(methodCode);
    if (!method) {
      return res.status(404).json({ message: 'Delivery method not found' });
    }


    // Compute subtotal and item count
    const subtotal = items.reduce(
      (sum, it) => sum + Number(it.price) * Number(it.quantity || 1),
      0
    );
    const itemCount = items.reduce(
      (sum, it) => sum + Number(it.quantity || 1),
      0
    );


    const delivery = method.price;
    const total = subtotal + delivery;


    res.json({
      method: {
        code: method.code,
        name: method.name,
        price: delivery,
        time_estimate: method.time_estimate,
      },
      subtotal: Number(subtotal.toFixed(2)),
      delivery: Number(delivery.toFixed(2)),
      total: Number(total.toFixed(2)),
      itemCount,
      display: {
        subtotal: `R${subtotal.toFixed(2)}`,
        delivery: `R${delivery.toFixed(2)}`,
        total: `R${total.toFixed(2)}`,
      },
    });
  } catch (error) {
    console.error('previewDelivery error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
