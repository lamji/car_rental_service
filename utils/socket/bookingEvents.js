/**
 * Booking-related Socket.IO event emitters
 * Modularized for better scalability
 */

const { formatDate } = require('../logging');

/**
 * Emits booking status update to connected clients
 * @param {Object} io - Socket.io instance
 * @param {Object} booking - Updated booking object
 * @param {string} action - Action performed (confirmed/cancelled/completed)
 */
function emitBookingStatusUpdate(io, booking, action) {
  try {
    const payload = {
      event: 'booking_status_updated',
      data: {
        booking: {
          id: booking.id,
          userId: booking.userId,
          carId: booking.carId,
          status: action,
          startDate: booking.startDate,
          endDate: booking.endDate,
          totalPrice: booking.totalPrice
        },
        action,
        timestamp: new Date().toISOString()
      }
    };

    // Emit to specific user room
    io.to(`user:${booking.userId}`).emit('booking_status_updated', payload);
    
    // Emit to specific car room
    io.to(`car:${booking.carId}`).emit('booking_status_updated', payload);
    
    // Emit to admin room
    io.to('admin').emit('booking_status_updated', payload);
    
    console.log(`\n[${formatDate()}] - 📡 BOOKING STATUS EMITTED | Booking: ${booking.id} | Action: ${action}`);
    
  } catch (error) {
    console.error(`[${formatDate()}] - 🔴 ERROR EMITTING BOOKING STATUS:`, error);
  }
}

/**
 * Emits new booking event to connected clients
 * @param {Object} io - Socket.io instance
 * @param {Object} booking - New booking object
 */
function emitBookingCreated(io, booking) {
  try {
    const payload = {
      event: 'booking_created',
      data: {
        booking: {
          id: booking.id,
          userId: booking.userId,
          carId: booking.carId,
          status: booking.status,
          startDate: booking.startDate,
          endDate: booking.endDate,
          totalPrice: booking.totalPrice
        },
        timestamp: new Date().toISOString()
      }
    };

    // Emit to specific user room
    io.to(`user:${booking.userId}`).emit('booking_created', payload);
    
    // Emit to specific car room
    io.to(`car:${booking.carId}`).emit('booking_created', payload);
    
    // Emit to admin room
    io.to('admin').emit('booking_created', payload);
    
    console.log(`\n[${formatDate()}] - 📡 BOOKING CREATED EMITTED | Booking: ${booking.id}`);
    
  } catch (error) {
    console.error(`[${formatDate()}] - 🔴 ERROR EMITTING BOOKING CREATED:`, error);
  }
}

/**
 * Emits payment status update to connected clients
 * @param {Object} io - Socket.io instance
 * @param {Object} payment - Updated payment object
 * @param {string} status - Payment status (paid/failed/refunded)
 */
function emitPaymentStatusUpdate(io, payment, status) {
  try {
    const payload = {
      event: 'payment_status_updated',
      data: {
        payment: {
          id: payment.id,
          bookingId: payment.bookingId,
          userId: payment.userId,
          amount: payment.amount,
          status: status
        },
        timestamp: new Date().toISOString()
      }
    };

    // Emit to specific user room
    io.to(`user:${payment.userId}`).emit('payment_status_updated', payload);
    
    // Emit to admin room
    io.to('admin').emit('payment_status_updated', payload);
    
    console.log(`\n[${formatDate()}] - 📡 PAYMENT STATUS EMITTED | Payment: ${payment.id} | Status: ${status}`);
    
  } catch (error) {
    console.error(`[${formatDate()}] - 🔴 ERROR EMITTING PAYMENT STATUS:`, error);
  }
}

module.exports = {
  emitBookingStatusUpdate,
  emitBookingCreated,
  emitPaymentStatusUpdate
};
