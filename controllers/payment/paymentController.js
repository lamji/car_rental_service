
const { createPaymentIntent } = require('../../paymongo/payment-intent');
const { createPaymentMethod, attachPaymentMethod } = require('../../paymongo/attach-method');
const { getPaymentStatus } = require('../../paymongo/payment-status');
const { refundPayment } = require('../../paymongo/refund-payment');
const { createPaymentLink, getPaymentLink } = require('../../paymongo/payment-link');

// Re-export all functions from paymongo directory
exports.createPaymentIntent = createPaymentIntent;
exports.createPaymentMethod = createPaymentMethod;
exports.attachPaymentMethod = attachPaymentMethod;
exports.getPaymentStatus = getPaymentStatus;
exports.refundPayment = refundPayment;
exports.createPaymentLink = createPaymentLink;
exports.getPaymentLink = getPaymentLink;
