const express = require('express');
const router = express.Router();

const {
  createBooking,
  getBookings,
  getBookingById,
  getBookingByBookingId,
  updateBooking,
  updatePaymentStatus,
  updatePaymentStatusByBookingId,
  updateBookingStatus,
  deleteBooking,
  getUserBookings,
  getCarBookings
} = require('../controllers/booking/bookingController');

const { protect } = require('../middleware/auth');
const { guestOrAuth } = require('../middleware/guestOrAuth');
const {
  validateCreateBooking,
  validateUpdateBooking,
  validateUpdatePaymentStatus,
  validateUpdateBookingStatus,
  validateObjectId,
  validateBookingId,
  validateBookingQuery
} = require('../validators/bookingValidator');

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private (supports guest tokens)
router.post('/', guestOrAuth, validateCreateBooking, createBooking);

// @route   GET /api/bookings
// @desc    Get all bookings with pagination and filtering
// @access  Private (supports guest tokens)
router.get('/', guestOrAuth, validateBookingQuery, getBookings);

// Apply authentication middleware to all remaining routes
router.use(protect);

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

// @route   PATCH /api/bookings/booking-id/:bookingId/payment-status
// @desc    Update booking payment status by bookingId (e.g. BK-MLJHVDVT)
// @access  Private
router.patch('/booking-id/:bookingId/payment-status', validateBookingId, validateUpdatePaymentStatus, updatePaymentStatusByBookingId);

// @route   PATCH /api/bookings/:id/booking-status
// @desc    Update booking status
// @access  Private
router.patch('/:id/booking-status', validateObjectId, validateUpdateBookingStatus, updateBookingStatus);

// @route   DELETE /api/bookings/:id
// @desc    Delete booking
// @access  Private
router.delete('/:id', validateObjectId, deleteBooking);

module.exports = router;
