const { body, param, query } = require('express-validator');

// Validate create booking
exports.validateCreateBooking = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isString()
    .withMessage('User ID must be a string'),
  
  body('bookingId')
    .notEmpty()
    .withMessage('Booking ID is required')
    .isString()
    .withMessage('Booking ID must be a string'),
  
  body('bookingDetails.startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid date (YYYY-MM-DD)'),
  
  body('bookingDetails.endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid date (YYYY-MM-DD)'),
  
  body('bookingDetails.startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format (24-hour)'),
  
  body('bookingDetails.endTime')
    .notEmpty()
    .withMessage('End time is required')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format (24-hour)'),
  
  body('bookingDetails.pickupType')
    .isIn(['delivery', 'pickup'])
    .withMessage('Pickup type must be either delivery or pickup'),
  
  body('bookingDetails.rentalPrice')
    .isNumeric()
    .withMessage('Rental price must be a number')
    .isFloat({ min: 0 })
    .withMessage('Rental price must be greater than or equal to 0'),
  
  body('bookingDetails.deliveryFee')
    .isNumeric()
    .withMessage('Delivery fee must be a number')
    .isFloat({ min: 0 })
    .withMessage('Delivery fee must be greater than or equal to 0'),
  
  body('bookingDetails.totalPrice')
    .isNumeric()
    .withMessage('Total price must be a number')
    .isFloat({ min: 0 })
    .withMessage('Total price must be greater than or equal to 0'),
  
  body('bookingDetails.pricingType')
    .isIn(['hourly', '12-hours', '24-hours', 'daily'])
    .withMessage('Pricing type must be one of: hourly, 12-hours, 24-hours, daily'),
  
  body('bookingDetails.durationHours')
    .isNumeric()
    .withMessage('Duration hours must be a number')
    .isFloat({ min: 0 })
    .withMessage('Duration hours must be greater than or equal to 0'),
  
  body('bookingDetails.dataConsent')
    .isBoolean()
    .withMessage('Data consent must be a boolean'),
  
  body('bookingDetails.firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isString()
    .withMessage('First name must be a string')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('bookingDetails.lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isString()
    .withMessage('Last name must be a string')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('bookingDetails.contactNumber')
    .notEmpty()
    .withMessage('Contact number is required')
    .isMobilePhone()
    .withMessage('Contact number must be a valid mobile phone number'),
  
  body('bookingDetails.email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be a valid email address'),
  
  body('bookingDetails.idType')
    .isIn(['drivers_license', 'passport', 'national_id', 'postal_id', 'sss_id', 'gsis_id', 'philhealth_id', 'pagibig_id', 'prc_license', 'senior_citizen_id', 'voters_id', 'student_id', 'others'])
    .withMessage('ID type must be a valid Philippine ID type'),
  
  body('bookingDetails.licenseNumber')
    .notEmpty()
    .withMessage('License number is required')
    .isString()
    .withMessage('License number must be a string'),
  
  body('selectedCar')
    .notEmpty()
    .withMessage('Car ID is required')
    .customSanitizer((value) => {
      // Accept either a plain ObjectId string or an object with _id
      if (value && typeof value === 'object' && value._id) {
        return value._id;
      }
      return value;
    })
    .isMongoId()
    .withMessage('Invalid car ID')
];

// Validate update booking
exports.validateUpdateBooking = [
  body('bookingDetails')
    .optional()
    .isObject()
    .withMessage('Booking details must be an object'),
  
  body('paymentStatus')
    .optional()
    .isIn(['pending', 'paid', 'failed', 'refunded', 'cancelled'])
    .withMessage('Payment status must be one of: pending, paid, failed, refunded, cancelled'),
  
  body('bookingStatus')
    .optional()
    .isIn(['pending', 'confirmed', 'active', 'completed', 'cancelled'])
    .withMessage('Booking status must be one of: pending, confirmed, active, completed, cancelled'),
  
  body('paymentMethod')
    .optional()
    .isObject()
    .withMessage('Payment method must be an object')
];

// Validate update payment status
exports.validateUpdatePaymentStatus = [
  body('paymentStatus')
    .notEmpty()
    .withMessage('Payment status is required')
    .isIn(['pending', 'paid', 'failed', 'refunded', 'cancelled'])
    .withMessage('Payment status must be one of: pending, paid, failed, refunded, cancelled'),
  
  body('paymentMethod')
    .optional()
    .isObject()
    .withMessage('Payment method must be an object')
];

// Validate update booking status
exports.validateUpdateBookingStatus = [
  body('bookingStatus')
    .notEmpty()
    .withMessage('Booking status is required')
    .isIn(['pending', 'confirmed', 'active', 'completed', 'cancelled'])
    .withMessage('Booking status must be one of: pending, confirmed, active, completed, cancelled')
];

// Validate MongoDB ObjectId
exports.validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format')
];

// Validate booking ID
exports.validateBookingId = [
  param('bookingId')
    .notEmpty()
    .withMessage('Booking ID is required')
    .isString()
    .withMessage('Booking ID must be a string')
];

// Validate pagination and filtering
exports.validateBookingQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('status')
    .optional()
    .isIn(['pending', 'paid', 'failed', 'refunded', 'cancelled'])
    .withMessage('Status must be one of: pending, paid, failed, refunded, cancelled'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'bookingDetails.startDate', 'bookingDetails.endDate', 'totalPrice'])
    .withMessage('Sort by field is invalid'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date (YYYY-MM-DD)'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date (YYYY-MM-DD)'),
  
  query('email')
    .optional()
    .isEmail()
    .withMessage('Email must be a valid email address')
];
