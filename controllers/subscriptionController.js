import Subscription from '../models/subscription.js';


// @desc    Get all available subscription plans
// @route   GET /api/subscriptions/plans
// @access  Public (or protect if you want it vendor-only)
export const getPlans = async (req, res) => {
  try {
    const plans = await Subscription.getAllPlans();
    res.json(plans);
  } catch (error) {
    console.error('getPlans error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// @desc    Get the logged-in vendor's current subscription
// @route   GET /api/subscriptions/me
// @access  Vendor
export const getMySubscription = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id;
    const sub = await Subscription.getActiveForVendor(vendorId);
    res.json(sub); // null if no active subscription
  } catch (error) {
    console.error('getMySubscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// @desc    Subscribe the logged-in vendor to a plan
// @route   POST /api/subscriptions/subscribe
// @access  Vendor
export const subscribe = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id;
    const { planSlug, planId } = req.body;


    if (!planSlug && !planId) {
      return res.status(400).json({ message: 'planSlug or planId is required' });
    }


    const plan = planSlug
      ? await Subscription.getPlanBySlug(planSlug)
      : await Subscription.getPlanById(planId);


    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }


    const subId = await Subscription.subscribe(vendorId, plan.id);


    res.status(201).json({
      id: subId,
      status: 'active',
      plan: {
        id: plan.id,
        slug: plan.slug,
        name: plan.name,
        price: Number(plan.price),
        billing_period: plan.billing_period,
      },
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    console.error('subscribe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// @desc    Cancel the vendor's active subscription
// @route   POST /api/subscriptions/cancel
// @access  Vendor
export const cancelSubscription = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id;
    const affected = await Subscription.cancel(vendorId);


    if (affected === 0) {
      return res.status(404).json({ message: 'No active subscription to cancel' });
    }


    res.json({ message: 'Subscription cancelled' });
  } catch (error) {
    console.error('cancelSubscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
