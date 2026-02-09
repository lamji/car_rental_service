const express = require('express');
const router = express.Router();

const {
  createBooking,
  getBookings,
  getBookingById,
  getBookingByBookingId,
  updateBooking,
  updatePaymentStatus,
  updateBookingStatus,
  deleteBooking,
  getUserBookings,
  getCarBookings
} = require('../controllers/booking/bookingController');

const { protect } = require('../middleware/auth');
const {
  validateCreateBooking,
  validateUpdateBooking,
  validateUpdatePaymentStatus,
  validateUpdateBookingStatus,
  validateObjectId,
  validateBookingId,
  validateBookingQuery
} = require('../validators/bookingValidator');

// Apply authentication middleware to all routes
router.use(protect);

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private
router.post('/', validateCreateBooking, createBooking);

// @route   GET /api/bookings
// @desc    Get all bookings with pagination and filtering
// @access  Private
router.get('/', validateBookingQuery, getBookings);

// @route   GET /api/bookings/user/:userId
// @desc    Get user bookings
// @access  Private
router.get('/user/:userId', validateBookingQuery, getUserBookings);

// @route   GET /api/bookings/car/:carId
// @desc    Get car bookings
// @access  Private
router.get('/car/:carId', getCarBookings);

// @route   GET /api/bookings/booking-id/:bookingId
// @desc    Get booking by bookingId
// @access  Private
router.get('/booking-id/:bookingId', validateBookingId, getBookingByBookingId);

// @route   GET /api/bookings/:id
// @desc    Get booking by ID
// @access  Private
router.get('/:id', validateObjectId, getBookingById);

// @route   PUT /api/bookings/:id
// @desc    Update booking
// @access  Private
router.put('/:id', validateObjectId, validateUpdateBooking, updateBooking);

// @route   PATCH /api/bookings/:id/payment-status
// @desc    Update booking payment status
// @access  Private
router.patch('/:id/payment-status', validateObjectId, validateUpdatePaymentStatus, updatePaymentStatus);

// @route   PATCH /api/bookings/:id/booking-status
// @desc    Update booking status
// @access  Private
router.patch('/:id/booking-status', validateObjectId, validateUpdateBookingStatus, updateBookingStatus);

// @route   DELETE /api/bookings/:id
// @desc    Delete booking
// @access  Private
router.delete('/:id', validateObjectId, deleteBooking);

module.exports = router;
