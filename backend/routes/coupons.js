const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');

// Validate a coupon code
router.post('/validate', authenticate, async (req, res) => {
    try {
        const { code, totalAmount } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Coupon code is required' });
        }

        const [coupons] = await db.query(
            'SELECT * FROM coupons WHERE code = ? AND is_active = 1 AND valid_until > NOW()',
            [code]
        );

        if (coupons.length === 0) {
            return res.status(404).json({ error: 'Invalid or expired coupon' });
        }

        const coupon = coupons[0];

        if (coupon.current_uses >= coupon.max_uses) {
            return res.status(400).json({ error: 'Coupon usage limit reached' });
        }

        // Advanced condition: Minimum purchase amount
        if (totalAmount && parseFloat(totalAmount) < parseFloat(coupon.min_purchase_amount)) {
            return res.status(400).json({ 
                error: `Minimum purchase of ₹${coupon.min_purchase_amount} required for this coupon` 
            });
        }

        res.json({
            message: 'Coupon validated',
            discount_value: coupon.discount_value,
            discount_type: coupon.discount_type,
            min_purchase: coupon.min_purchase_amount,
            code: coupon.code
        });
    } catch (error) {
        console.error('Error validating coupon:', error);
        res.status(500).json({ error: 'Server error validating coupon' });
    }
});

module.exports = router;
