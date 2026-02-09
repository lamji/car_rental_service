const { body, param, query } = require('express-validator');

// Validate create car
exports.validateCreateCar = [
  body('id')
    .notEmpty()
    .withMessage('Car ID is required')
    .isString()
    .withMessage('Car ID must be a string')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Car ID must contain only lowercase letters, numbers, and hyphens'),
  
  body('name')
    .notEmpty()
    .withMessage('Car name is required')
    .isString()
    .withMessage('Car name must be a string')
    .isLength({ min: 2, max: 100 })
    .withMessage('Car name must be between 2 and 100 characters'),
  
  body('type')
    .isIn(['sedan', 'suv', 'van', 'pickup truck', 'sports car', 'coupe', 'hatchback'])
    .withMessage('Car type must be one of: sedan, suv, van, pickup truck, sports car, coupe, hatchback'),
  
  body('image')
    .notEmpty()
    .withMessage('Car image is required')
    .isURL()
    .withMessage('Car image must be a valid URL'),
  
  body('imageUrls')
    .optional()
    .isArray()
    .withMessage('Image URLs must be an array')
    .custom((value) => {
      if (value && value.length > 0) {
        for (const url of value) {
          if (!typeof url === 'string' || !url.match(/^https?:\/\/.+/)) {
            throw new Error('All image URLs must be valid URLs');
          }
        }
      }
      return true;
    }),
  
  body('fuel')
    .isIn(['gasoline', 'diesel', 'electric', 'hybrid'])
    .withMessage('Fuel type must be one of: gasoline, diesel, electric, hybrid'),
  
  body('year')
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage(`Year must be between 1900 and ${new Date().getFullYear() + 1}`),
  
  body('pricePerDay')
    .isNumeric()
    .withMessage('Price per day must be a number')
    .isFloat({ min: 0 })
    .withMessage('Price per day must be greater than or equal to 0'),
  
  body('pricePer12Hours')
    .isNumeric()
    .withMessage('Price per 12 hours must be a number')
    .isFloat({ min: 0 })
    .withMessage('Price per 12 hours must be greater than or equal to 0'),
  
  body('pricePer24Hours')
    .isNumeric()
    .withMessage('Price per 24 hours must be a number')
    .isFloat({ min: 0 })
    .withMessage('Price per 24 hours must be greater than or equal to 0'),
  
  body('pricePerHour')
    .isNumeric()
    .withMessage('Price per hour must be a number')
    .isFloat({ min: 0 })
    .withMessage('Price per hour must be greater than or equal to 0'),
  
  body('seats')
    .isInt({ min: 1, max: 20 })
    .withMessage('Seats must be between 1 and 20'),
  
  body('transmission')
    .isIn(['manual', 'automatic'])
    .withMessage('Transmission must be either manual or automatic'),
  
  body('deliveryFee')
    .isNumeric()
    .withMessage('Delivery fee must be a number')
    .isFloat({ min: 0 })
    .withMessage('Delivery fee must be greater than or equal to 0'),
  
  body('garageAddress')
    .notEmpty()
    .withMessage('Garage address is required')
    .isString()
    .withMessage('Garage address must be a string'),
  
  body('garageLocation.address')
    .notEmpty()
    .withMessage('Garage location address is required')
    .isString()
    .withMessage('Garage location address must be a string'),
  
  body('garageLocation.city')
    .notEmpty()
    .withMessage('Garage location city is required')
    .isString()
    .withMessage('Garage location city must be a string'),
  
  body('garageLocation.province')
    .notEmpty()
    .withMessage('Garage location province is required')
    .isString()
    .withMessage('Garage location province must be a string'),
  
  body('garageLocation.coordinates.lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('garageLocation.coordinates.lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  body('owner.name')
    .notEmpty()
    .withMessage('Owner name is required')
    .isString()
    .withMessage('Owner name must be a string'),
  
  body('owner.contactNumber')
    .notEmpty()
    .withMessage('Owner contact number is required')
    .isString()
    .withMessage('Owner contact number must be a string'),
  
  body('selfDrive')
    .optional()
    .isBoolean()
    .withMessage('Self drive must be a boolean'),
  
  body('driverCharge')
    .optional()
    .isNumeric()
    .withMessage('Driver charge must be a number')
    .isFloat({ min: 0 })
    .withMessage('Driver charge must be greater than or equal to 0'),
  
  body('rating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be between 0 and 5'),
  
  body('rentedCount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Rented count must be a non-negative integer')
];

// Validate update car
exports.validateUpdateCar = [
  body('name')
    .optional()
    .isString()
    .withMessage('Car name must be a string')
    .isLength({ min: 2, max: 100 })
    .withMessage('Car name must be between 2 and 100 characters'),
  
  body('type')
    .optional()
    .isIn(['sedan', 'suv', 'van', 'pickup truck', 'sports car', 'coupe', 'hatchback'])
    .withMessage('Car type must be one of: sedan, suv, van, pickup truck, sports car, coupe, hatchback'),
  
  body('image')
    .optional()
    .isURL()
    .withMessage('Car image must be a valid URL'),
  
  body('imageUrls')
    .optional()
    .isArray()
    .withMessage('Image URLs must be an array'),
  
  body('fuel')
    .optional()
    .isIn(['gasoline', 'diesel', 'electric', 'hybrid'])
    .withMessage('Fuel type must be one of: gasoline, diesel, electric, hybrid'),
  
  body('year')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage(`Year must be between 1900 and ${new Date().getFullYear() + 1}`),
  
  body('pricePerDay')
    .optional()
    .isNumeric()
    .withMessage('Price per day must be a number')
    .isFloat({ min: 0 })
    .withMessage('Price per day must be greater than or equal to 0'),
  
  body('pricePer12Hours')
    .optional()
    .isNumeric()
    .withMessage('Price per 12 hours must be a number')
    .isFloat({ min: 0 })
    .withMessage('Price per 12 hours must be greater than or equal to 0'),
  
  body('pricePer24Hours')
    .optional()
    .isNumeric()
    .withMessage('Price per 24 hours must be a number')
    .isFloat({ min: 0 })
    .withMessage('Price per 24 hours must be greater than or equal to 0'),
  
  body('pricePerHour')
    .optional()
    .isNumeric()
    .withMessage('Price per hour must be a number')
    .isFloat({ min: 0 })
    .withMessage('Price per hour must be greater than or equal to 0'),
  
  body('seats')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Seats must be between 1 and 20'),
  
  body('transmission')
    .optional()
    .isIn(['manual', 'automatic'])
    .withMessage('Transmission must be either manual or automatic'),
  
  body('deliveryFee')
    .optional()
    .isNumeric()
    .withMessage('Delivery fee must be a number')
    .isFloat({ min: 0 })
    .withMessage('Delivery fee must be greater than or equal to 0'),
  
  body('selfDrive')
    .optional()
    .isBoolean()
    .withMessage('Self drive must be a boolean'),
  
  body('driverCharge')
    .optional()
    .isNumeric()
    .withMessage('Driver charge must be a number')
    .isFloat({ min: 0 })
    .withMessage('Driver charge must be greater than or equal to 0'),
  
  body('rating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be between 0 and 5'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Is active must be a boolean'),

body('isOnHold')
    .optional()
    .isBoolean()
    .withMessage('Is on hold must be a boolean')
];

// Validate car ID
exports.validateCarId = [
  param('id')
    .notEmpty()
    .withMessage('Car ID is required')
    .isString()
    .withMessage('Car ID must be a string')
];

// Validate MongoDB ObjectId
exports.validateMongoId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid MongoDB ID format')
];

// Validate car query parameters
exports.validateCarQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('type')
    .optional()
    .isIn(['sedan', 'suv', 'van', 'pickup truck', 'sports car', 'coupe', 'hatchback'])
    .withMessage('Type must be a valid car type'),
  
  query('city')
    .optional()
    .isString()
    .withMessage('City must be a string'),
  
  query('province')
    .optional()
    .isString()
    .withMessage('Province must be a string'),
  
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a non-negative number'),
  
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a non-negative number'),
  
  query('fuel')
    .optional()
    .isIn(['gasoline', 'diesel', 'electric', 'hybrid'])
    .withMessage('Fuel type must be one of: gasoline, diesel, electric, hybrid'),
  
  query('transmission')
    .optional()
    .isIn(['manual', 'automatic'])
    .withMessage('Transmission must be either manual or automatic'),
  
  query('seats')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Seats must be between 1 and 20'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'name', 'pricePerDay', 'rating', 'rentedCount', 'year'])
    .withMessage('Sort by field is invalid'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  query('search')
    .optional()
    .isString()
    .withMessage('Search term must be a string')
    .isLength({ min: 2, max: 100 })
    .withMessage('Search term must be between 2 and 100 characters'),
  
  query('availableFrom')
    .optional()
    .isISO8601()
    .withMessage('Available from date must be a valid date (YYYY-MM-DD)'),
  
  query('availableTo')
    .optional()
    .isISO8601()
    .withMessage('Available to date must be a valid date (YYYY-MM-DD)'),
  
  query('q')
    .optional()
    .isString()
    .withMessage('Search query must be a string')
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters')
];

// Validate availability updates
exports.validateAvailability = [
  body('unavailableDates')
    .optional()
    .isArray()
    .withMessage('Unavailable dates must be an array')
    .custom((value) => {
      if (value && value.length > 0) {
        for (const date of value) {
          if (!typeof date === 'string' || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            throw new Error('All unavailable dates must be in YYYY-MM-DD format');
          }
        }
      }
      return true;
    }),
  
  body('isAvailableToday')
    .optional()
    .isBoolean()
    .withMessage('Is available today must be a boolean'),
  
  body('dates')
    .optional()
    .isArray()
    .withMessage('Dates must be an array')
    .custom((value) => {
      if (value && value.length > 0) {
        for (const date of value) {
          if (!typeof date === 'string' || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            throw new Error('All dates must be in YYYY-MM-DD format');
          }
        }
      }
      return true;
    })
];

// Validate rating updates
exports.validateRating = [
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be a number between 0 and 5')
];
