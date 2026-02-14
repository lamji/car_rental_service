const { logError, formatDate } = require('../../utils/logging');
const Booking = require('../../models/booking');
const { emitPaymentStatusUpdate } = require('../../utils/socket');
const { setJSON, clearCache } = require('../../utils/redis');
const { sendPaymentSuccessEmail } = require('../../utils/bookingEmail');

async function handlePaymentPaid(event) {
  try {
    const payment = event; // event is already the payment object
    console.log(`[${formatDate()}] - PAYMENT PAID | ID: ${payment.id}`);

    const metadata = payment.attributes?.metadata || payment.attributes?.payment_intent?.metadata || {};
    const bookingId = metadata.bookingId;

    if (!bookingId) {
      console.log(`[${formatDate()}] - Payment not linked to any booking (no bookingId in metadata)`);
      return;
    }

    console.log(`[${formatDate()}] - Updating booking ${bookingId} paymentStatus to 'paid'`);

    const updatedBooking = await Booking.findOneAndUpdate(
      { bookingId },
      {
        $set: {
          paymentStatus: 'paid',
          bookingStatus: 'confirmed',
          'paymentDetails.paymentId': payment.id,
          'paymentDetails.paymentMethod': payment.attributes?.source?.type || 'gcash',
          'paymentDetails.amount': (payment.attributes?.amount || 0) / 100,
          'paymentDetails.paidAt': new Date(),
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!updatedBooking) {
      console.log(`[${formatDate()}] - Booking ${bookingId} not found in database`);
      return;
    }

    console.log(`[${formatDate()}] - Booking ${bookingId} updated to paid/confirmed`);

    // Update Redis cache
    try {
      await clearCache('bookings');
      console.log(`[${formatDate()}] - Bookings cache cleared after payment`);
    } catch (cacheErr) {
      console.error(`[${formatDate()}] - Redis cache error:`, cacheErr.message);
    }

    // Emit socket event to notify frontend
    if (global.io) {
      // Emit to the userAgent room (same room used for hold events)
      const userAgent = metadata.userId || '';
      emitPaymentStatusUpdate(global.io, {
        id: payment.id,
        bookingId: bookingId,
        userId: userAgent,
        amount: (payment.attributes?.amount || 0) / 100,
      }, 'paid');

      // Also broadcast to all clients so the waiting page can pick it up
      global.io.emit('payment_status_updated', {
        event: 'payment_status_updated',
        data: {
          bookingId,
          status: 'paid',
          paymentId: payment.id,
          amount: (payment.attributes?.amount || 0) / 100,
          metadata,
        },
      });
      console.log(`[${formatDate()}] - payment_status_updated socket event emitted for ${bookingId}`);
    }

    // Send payment success email (async, non-blocking)
    const populatedBooking = await Booking.findOne({ bookingId }).populate('selectedCar');
    if (populatedBooking) {
      sendPaymentSuccessEmail(populatedBooking).catch(err => {
        console.error(`[${formatDate()}] - Payment success email error (non-blocking):`, err.message);
      });
    }
  } catch (error) {
    logError(`Error handling payment paid: ${error.message}`);
  }
}

module.exports = { handlePaymentPaid };