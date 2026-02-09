const express = require('express');
const router = express.Router();

const {
  createCar,
  getCars,
  getCarById,
  getCarByMongoId,
  updateCar,
  deleteCar,
  hardDeleteCar,
  getCarsByType,
  getCarsByLocation,
  getAvailableCars,
  searchCars,
  updateAvailability,
  updateHoldStatus,
  addUnavailableDates,
  removeUnavailableDates,
  incrementRentedCount,
  updateRating,
  holdCarDates,
  releaseCarDates
} = require('../controllers/car/carController');

const { protect } = require('../middleware/auth');
const {
  validateCreateCar,
  validateUpdateCar,
  validateCarId,
  validateMongoId,
  validateCarQuery,
  validateAvailability,
  validateRating
} = require('../validators/carValidator');

// Public routes (no authentication required)

// @route   GET /api/cars
// @desc    Get all cars with pagination and filtering
// @access  Public
router.get('/', validateCarQuery, getCars);

// @route   GET /api/cars/type/:type
// @desc    Get cars by type (sedan, suv, van, etc.)
// @access  Public
router.get('/type/:type', validateCarQuery, getCarsByType);

// @route   GET /api/cars/location
// @desc    Get cars by location (city and/or province)
// @access  Public
router.get('/location', validateCarQuery, getCarsByLocation);

// @route   GET /api/cars/available
// @desc    Get cars available for specific date range
// @access  Public
router.get('/available', validateCarQuery, getAvailableCars);

// @route   GET /api/cars/search
// @desc    Search cars by name, type, city, or province
// @access  Public
router.get('/search', validateCarQuery, searchCars);

// @route   GET /api/cars/:id
// @desc    Get car by ID (e.g., "vios-2021")
// @access  Public
router.get('/:id', validateCarId, getCarById);

// @route   POST /api/cars/hold-date/:id
// @desc    Hold car dates temporarily to prevent double booking
// @access  Public
router.post('/hold-date/:id', validateMongoId, holdCarDates);

// @route   DELETE /api/cars/release-date/:id
// @desc    Release/remove specific car dates from unavailableDates
// @access  Public
router.delete('/release-date/:id', validateMongoId, releaseCarDates);

// Protected routes (authentication required)
router.use(protect); // Apply auth middleware to all routes below

// @route   POST /api/cars
// @desc    Create a new car
// @access  Private
router.post('/', validateCreateCar, createCar);

// @route   GET /api/cars/mongo/:id
// @desc    Get car by MongoDB ObjectId
// @access  Private
router.get('/mongo/:id', validateMongoId, getCarByMongoId);

// @route   PUT /api/cars/:id
// @desc    Update car
// @access  Private
router.put('/:id', validateCarId, validateUpdateCar, updateCar);

// @route   DELETE /api/cars/:id
// @desc    Soft delete car
// @access  Private
router.delete('/:id', validateCarId, deleteCar);

// @route   DELETE /api/cars/:id/hard
// @desc    Hard delete car (permanent)
// @access  Private
router.delete('/:id/hard', validateCarId, hardDeleteCar);

// @route   PATCH /api/cars/:id/availability
// @desc    Update car availability
// @access  Private
router.patch('/:id/availability', validateCarId, validateAvailability, updateAvailability);

// @route   PATCH /api/cars/:id/hold-status
// @desc    Update car hold status
// @access  Private
router.patch('/:id/hold-status', validateCarId, updateHoldStatus);

// @route   PATCH /api/cars/mongo/:id/hold-status
// @desc    Update car hold status by MongoDB ObjectId
// @access  Private
router.patch('/mongo/:id/hold-status', validateMongoId, updateHoldStatus);

// @route   POST /api/cars/:id/unavailable-dates
// @desc    Add unavailable dates to car
// @access  Private
router.post('/:id/unavailable-dates', validateCarId, validateAvailability, addUnavailableDates);

// @route   DELETE /api/cars/:id/unavailable-dates
// @desc    Remove unavailable dates from car
// @access  Private
router.delete('/:id/unavailable-dates', validateCarId, validateAvailability, removeUnavailableDates);

// @route   PATCH /api/cars/:id/increment-rented
// @desc    Increment car rented count
// @access  Private
router.patch('/:id/increment-rented', validateCarId, incrementRentedCount);

// @route   PATCH /api/cars/:id/rating
// @desc    Update car rating
// @access  Private
router.patch('/:id/rating', validateCarId, validateRating, updateRating);

module.exports = router;
