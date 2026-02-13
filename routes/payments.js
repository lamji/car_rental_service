const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  createPaymentMethod,
  attachPaymentMethod,
  getPaymentStatus,
  refundPayment,
  createPaymentLink,
  getPaymentLink
} = require('../controllers/payment/paymentController');
const {
  validatePaymentIntent,
  validatePaymentMethod,
  validateAttachPayment,
  validateRefund,
  validatePaymentLink
} = require('../validators/paymentValidator');
const { protect } = require('../middleware/auth');
const { guestOrAuth } = require('../middleware/guestOrAuth');
const { PayMongoWebhookHandler } = require('../paymongo/webhook');
const { gcashPayment } = require('../paymongo/gcash-payment');
const webhookHandler = new PayMongoWebhookHandler();

// Payment Intent routes
router.post('/intent', protect, validatePaymentIntent, createPaymentIntent);

// Payment Method routes
router.post('/method', protect, validatePaymentMethod, createPaymentMethod);
router.post('/attach', protect, validateAttachPayment, attachPaymentMethod);

// GCash payment route (full flow: intent → method → attach)
router.post('/gcash', guestOrAuth, gcashPayment);

// Payment Link routes (user can choose payment method)
router.post('/link', protect, validatePaymentLink, createPaymentLink);
router.get('/link/:linkId', protect, getPaymentLink);

// Payment Status routes
router.get('/:paymentId', protect, getPaymentStatus);

// Refund routes
router.post('/refund', protect, validateRefund, refundPayment);

// Webhook route (no auth required - PayMongo only)
router.post('/webhook', (req, res) => webhookHandler.handleWebhook(req, res));

// Make webhook route public (accessible without authentication)
module.exports = router;
