const { logError, formatDate } = require('../../utils/logging');
const Booking = require('../../models/booking');
const { emitPaymentStatusUpdate } = require('../../utils/socket');
const { clearCache } = require('../../utils/redis');

async function handlePaymentFailed(event) {
  try {
    const payment = event; // event is already the payment object
    console.log(`[${formatDate()}] - PAYMENT FAILED | ID: ${payment.id}`);

    const metadata = payment.attributes?.metadata || payment.attributes?.payment_intent?.metadata || {};
    const bookingId = metadata.bookingId;

    if (!bookingId) {
      console.log(`[${formatDate()}] - Failed payment not linked to any booking (no bookingId in metadata)`);
      return;
    }

    console.log(`[${formatDate()}] - Updating booking ${bookingId} paymentStatus to 'failed'`);

    const updatedBooking = await Booking.findOneAndUpdate(
      { bookingId },
      {
        $set: {
          paymentStatus: 'failed',
          'paymentDetails.paymentId': payment.id,
          'paymentDetails.failedAt': new Date(),
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!updatedBooking) {
      console.log(`[${formatDate()}] - Booking ${bookingId} not found in database`);
      return;
    }

    console.log(`[${formatDate()}] - Booking ${bookingId} updated to failed`);

    // Update Redis cache
    try {
      await clearCache('bookings');
    } catch (cacheErr) {
      console.error(`[${formatDate()}] - Redis cache error:`, cacheErr.message);
    }

    // Emit socket event to notify frontend
    if (global.io) {
      const userAgent = metadata.userId || '';
      emitPaymentStatusUpdate(global.io, {
        id: payment.id,
        bookingId: bookingId,
        userId: userAgent,
        amount: (payment.attributes?.amount || 0) / 100,
      }, 'failed');

      // Broadcast to all clients so the waiting page can pick it up
      global.io.emit('payment_status_updated', {
        event: 'payment_status_updated',
        data: {
          bookingId,
          status: 'failed',
          paymentId: payment.id,
          amount: (payment.attributes?.amount || 0) / 100,
          metadata,
        },
      });
      console.log(`[${formatDate()}] - payment_status_updated (failed) socket event emitted for ${bookingId}`);
    }
  } catch (error) {
    logError(`Error handling payment failed: ${error.message}`);
  }
}

module.exports = { handlePaymentFailed };
