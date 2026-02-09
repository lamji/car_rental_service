const { body } = require('express-validator');

// Validate payment intent creation
exports.validatePaymentIntent = [
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required'),
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .isFloat({ gt: 0 })
    .withMessage('Amount must be greater than 0'),
  body('paymentMethodAllowed')
    .optional()
    .isArray()
    .withMessage('Payment method allowed must be an array')
    .custom((value) => {
      const validMethods = ['card', 'gcash', 'paymaya', 'grab_pay', 'qrph', 'dob', 'billease', 'shopee_pay'];
      const invalidMethods = value.filter(method => !validMethods.includes(method));
      if (invalidMethods.length > 0) {
        throw new Error(`Invalid payment methods: ${invalidMethods.join(', ')}. Valid methods: ${validMethods.join(', ')}`);
      }
      return true;
    })
];

// Validate payment method creation - Only type is required
exports.validatePaymentMethod = [
  body('type')
    .notEmpty()
    .withMessage('Payment method type is required')
    .isIn(['card', 'gcash', 'paymaya', 'grab_pay', 'qrph', 'dob', 'brankas', 'billease', 'shopee_pay'])
    .withMessage('Invalid payment method type'),
  
  // expiry_seconds - only for QR Ph and ShopeePay (optional)
  body('expiry_seconds')
    .if(body('type').isIn(['qrph', 'shopee_pay']))
    .optional()
    .isInt({ min: 1 })
    .withMessage('Expiry seconds must be a positive integer for QR Ph and ShopeePay'),
  
  // details - optional for create payment method
  body('details')
    .optional()
    .isObject()
    .withMessage('Payment details must be an object'),
  
  // Optional billing information
  body('billing')
    .optional()
    .isObject()
    .withMessage('Billing information must be an object'),
  body('billing.name')
    .if(body('billing').exists())
    .notEmpty()
    .withMessage('Billing name is required'),
  body('billing.email')
    .if(body('billing').exists())
    .isEmail()
    .withMessage('Billing email must be valid'),
  body('billing.phone')
    .if(body('billing').exists())
    .matches(/^\+?[0-9]{10,15}$/)
    .withMessage('Billing phone must be a valid phone number'),
  body('billing.address')
    .if(body('billing').exists())
    .notEmpty()
    .withMessage('Billing address is required')
];

// Validate payment method attachment
exports.validateAttachPayment = [
  body('paymentIntentId')
    .notEmpty()
    .withMessage('Payment intent ID is required'),
  body('paymentMethodId')
    .notEmpty()
    .withMessage('Payment method ID is required'),
  body('returnUrl')
    .optional()
    .isURL()
    .withMessage('Return URL must be a valid URL')
];

// Validate source creation
exports.validateSource = [
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required'),
  body('type')
    .notEmpty()
    .withMessage('Source type is required')
    .isIn(['gcash', 'paymaya', 'grab_pay', 'qrph', 'dob', 'billease', 'shopee_pay'])
    .withMessage('Source type must be gcash, paymaya, grab_pay, qrph, dob, billease, or shopee_pay'),
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .isFloat({ gt: 0 })
    .withMessage('Amount must be greater than 0'),
  body('redirect')
    .notEmpty()
    .withMessage('Redirect information is required')
    .isObject()
    .withMessage('Redirect must be an object'),
  body('redirect.success')
    .isURL()
    .withMessage('Success URL must be a valid URL'),
  body('redirect.failed')
    .isURL()
    .withMessage('Failed URL must be a valid URL')
];

// Validate payment link creation
exports.validatePaymentLink = [
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .isFloat({ gt: 0 })
    .withMessage('Amount must be greater than 0'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .isLength({ min: 1, max: 255 })
    .withMessage('Description must be between 1 and 255 characters'),
  body('orderId')
    .optional()
    .isString()
    .withMessage('Order ID must be a string')
];

// Validate refund
exports.validateRefund = [
  body('paymentId')
    .notEmpty()
    .withMessage('Payment ID is required'),
  body('amount')
    .optional()
    .isNumeric()
    .withMessage('Amount must be a number')
    .isFloat({ gt: 0 })
    .withMessage('Amount must be greater than 0'),
  body('reason')
    .optional()
    .isIn(['requested_by_customer', 'duplicate', 'fraudulent'])
    .withMessage('Reason must be one of: requested_by_customer, duplicate, fraudulent')
];
