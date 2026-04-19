const express = require('express');
const router = express.Router();
const { createOrder, getOrders, getOrder, processPayment, updateOrderStatus } = require('../controllers/orderController');
const { auth, adminAuth } = require('../middleware/auth');

// Protected routes (user)
router.post('/', auth, createOrder);
router.get('/', auth, getOrders);
router.get('/:id', auth, getOrder);
router.post('/:id/payment', auth, processPayment);

// Protected routes (admin)
router.put('/:id/status', adminAuth, updateOrderStatus);

module.exports = router;