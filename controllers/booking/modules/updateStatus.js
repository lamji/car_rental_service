const Booking = require('../../../models/booking');
const { validationResult } = require('express-validator');
const { setJSON, clearCache } = require('../../../utils/redis');
const { formatDate } = require('../../../utils/logging');

// Valid state transitions to prevent illegal status changes
const VALID_PAYMENT_TRANSITIONS = {
  pending:   ['paid', 'failed', 'cancelled'],
  paid:      ['refunded'],
  failed:    ['pending'],   // allow retry
  refunded:  [],
  cancelled: []
};

const VALID_BOOKING_TRANSITIONS = {
  pending:   ['confirmed', 'cancelled'],
  confirmed: ['active', 'cancelled'],
  active:    ['completed', 'cancelled'],
  completed: [],
  cancelled: []
};

/**
 * Refresh the Redis bookings cache after any mutation.
 */
async function refreshBookingsCache() {
  try {
    await clearCache('bookings');
    const allBookings = await Booking.find().populate('selectedCar').sort({ createdAt: -1 });
    await setJSON('bookings', allBookings, 600);
    console.log(`[${formatDate()}] - REDIS SET bookings cache refreshed (${allBookings.length} bookings)`);
  } catch (err) {
    console.error(`[${formatDate()}] - REDIS bookings cache refresh error:`, err.message);
  }
}

// @desc    Update booking payment status
// @route   PATCH /api/bookings/:id/payment-status
// @access  Private
exports.updatePaymentStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { paymentStatus, paymentMethod } = req.body;
    
    if (!paymentStatus) {
      return res.status(400).json({
        success: false,
        message: 'Payment status is required'
      });
    }

    // Atomic: only update if current status allows the transition
    const allowedFrom = Object.entries(VALID_PAYMENT_TRANSITIONS)
      .filter(([, to]) => to.includes(paymentStatus))
      .map(([from]) => from);

    const updateData = { paymentStatus, updatedAt: new Date() };
    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }
    
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, paymentStatus: { $in: allowedFrom } },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!booking) {
      // Check if booking exists at all to give a better error
      const exists = await Booking.findById(req.params.id).select('paymentStatus').lean();
      if (!exists) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      return res.status(409).json({
        success: false,
        message: `Cannot transition payment from "${exists.paymentStatus}" to "${paymentStatus}"`
      });
    }

    await refreshBookingsCache();
    
    res.status(200).json({
      success: true,
      data: booking,
      message: 'Payment status updated successfully'
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating payment status',
      error: error.message
    });
  }
};

// @desc    Update booking payment status by bookingId (e.g. BK-MLJHVDVT)
// @route   PATCH /api/bookings/booking-id/:bookingId/payment-status
// @access  Private
exports.updatePaymentStatusByBookingId = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { paymentStatus, paymentMethod } = req.body;
    
    if (!paymentStatus) {
      return res.status(400).json({
        success: false,
        message: 'Payment status is required'
      });
    }

    // Atomic: only update if current status allows the transition
    const allowedFrom = Object.entries(VALID_PAYMENT_TRANSITIONS)
      .filter(([, to]) => to.includes(paymentStatus))
      .map(([from]) => from);

    const updateData = { paymentStatus, updatedAt: new Date() };
    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }
    
    const booking = await Booking.findOneAndUpdate(
      { bookingId: req.params.bookingId, paymentStatus: { $in: allowedFrom } },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!booking) {
      const exists = await Booking.findOne({ bookingId: req.params.bookingId }).select('paymentStatus').lean();
      if (!exists) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      return res.status(409).json({
        success: false,
        message: `Cannot transition payment from "${exists.paymentStatus}" to "${paymentStatus}"`
      });
    }

    await refreshBookingsCache();
    
    res.status(200).json({
      success: true,
      data: booking,
      message: 'Payment status updated successfully'
    });
  } catch (error) {
    console.error('Error updating payment status by bookingId:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error updating payment status',
      error: error.message
    });
  }
};

// @desc    Update booking status
// @route   PATCH /api/bookings/:id/booking-status
// @access  Private
exports.updateBookingStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { bookingStatus } = req.body;
    
    if (!bookingStatus) {
      return res.status(400).json({
        success: false,
        message: 'Booking status is required'
      });
    }

    // Atomic: only update if current status allows the transition
    const allowedFrom = Object.entries(VALID_BOOKING_TRANSITIONS)
      .filter(([, to]) => to.includes(bookingStatus))
      .map(([from]) => from);

    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, bookingStatus: { $in: allowedFrom } },
      { bookingStatus, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!booking) {
      const exists = await Booking.findById(req.params.id).select('bookingStatus').lean();
      if (!exists) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      return res.status(409).json({
        success: false,
        message: `Cannot transition booking from "${exists.bookingStatus}" to "${bookingStatus}"`
      });
    }

    await refreshBookingsCache();
    
    res.status(200).json({
      success: true,
      data: booking,
      message: 'Booking status updated successfully'
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating booking status',
      error: error.message
    });
  }
};
