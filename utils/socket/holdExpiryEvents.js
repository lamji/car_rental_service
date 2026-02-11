/**
 * Hold Expiry Socket.IO event emitters
 * Sends hold warning and expiry events to specific userAgent rooms
 */

const { formatDate } = require('../logging');

/**
 * Emits a hold expiry warning to a specific userAgent room
 * @param {Object} io - Socket.io instance
 * @param {string} room - UserAgent room name
 * @param {Object} data - { carId, bookingId, bookingDetails, secondsRemaining }
 */
function emitHoldWarning(io, room, data) {
  try {
    const payload = {
      event: 'hold_warning',
      data: {
        carId: data.carId,
        bookingId: data.bookingId,
        bookingDetails: data.bookingDetails,
        secondsRemaining: data.secondsRemaining,
        timestamp: new Date().toISOString(),
      },
    };

    io.to(room).emit('hold_warning', payload);

    console.log(`[${formatDate()}] - HOLD WARNING EMITTED | Room: ${room} | Seconds: ${data.secondsRemaining}`);
  } catch (error) {
    console.error(`[${formatDate()}] - ERROR EMITTING HOLD WARNING:`, error);
  }
}

/**
 * Emits a hold expired event to a specific userAgent room
 * @param {Object} io - Socket.io instance
 * @param {string} room - UserAgent room name
 * @param {Object} data - { carId, bookingId, bookingDetails }
 */
function emitHoldExpired(io, room, data) {
  try {
    const payload = {
      event: 'hold_expired',
      data: {
        carId: data.carId,
        bookingId: data.bookingId,
        bookingDetails: data.bookingDetails,
        timestamp: new Date().toISOString(),
      },
    };

    io.to(room).emit('hold_expired', payload);

    console.log(`[${formatDate()}] - HOLD EXPIRED EMITTED | Room: ${room} | Booking: ${data.bookingId}`);
  } catch (error) {
    console.error(`[${formatDate()}] - ERROR EMITTING HOLD EXPIRED:`, error);
  }
}

module.exports = {
  emitHoldWarning,
  emitHoldExpired,
};
