const nodemailer = require('nodemailer');
const { formatDate } = require('./logging');

/**
 * Booking Email Notification Utility
 * Reusable email sender for booking-related notifications.
 * Uses the same transporter pattern as auth controllers.
 */

function createTransporter() {
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else if (process.env.EMAIL_SERVICE === 'namecheap') {
    return nodemailer.createTransport({
      host: 'mail.privateemail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
}

function isEmailConfigured() {
  return !!(process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

function formatCurrency(amount) {
  return `P${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

function formatBookingDate(dateStr) {
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

/**
 * Send booking confirmation email (when booking is created)
 */
async function sendBookingConfirmationEmail(booking, car) {
  if (!isEmailConfigured()) {
    console.log(`[${formatDate()}] - Email not configured, skipping booking confirmation email`);
    return;
  }

  try {
    const details = booking.bookingDetails;
    const carName = car?.name || 'Your Car';
    const email = details.email;
    const firstName = details.firstName;

    const transporter = createTransporter();

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="background:#2563eb;padding:24px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:20px;">Booking Confirmed</h1>
        <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px;">Booking ID: ${booking.bookingId}</p>
      </div>
      <div style="padding:24px;">
        <p style="margin:0 0 16px;font-size:14px;color:#374151;">Hi <strong>${firstName}</strong>,</p>
        <p style="margin:0 0 20px;font-size:14px;color:#374151;">Your booking has been submitted successfully. Please complete the payment to confirm your reservation.</p>
        
        <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:16px;">
          <h3 style="margin:0 0 12px;font-size:14px;color:#111827;">Booking Details</h3>
          <table style="width:100%;font-size:13px;color:#374151;">
            <tr><td style="padding:4px 0;color:#6b7280;">Car</td><td style="padding:4px 0;text-align:right;font-weight:600;">${carName}</td></tr>
            <tr><td style="padding:4px 0;color:#6b7280;">Pickup</td><td style="padding:4px 0;text-align:right;">${formatBookingDate(details.startDate)} at ${details.startTime}</td></tr>
            <tr><td style="padding:4px 0;color:#6b7280;">Return</td><td style="padding:4px 0;text-align:right;">${formatBookingDate(details.endDate)} at ${details.endTime}</td></tr>
            <tr><td style="padding:4px 0;color:#6b7280;">Duration</td><td style="padding:4px 0;text-align:right;">${details.durationHours} hours</td></tr>
            <tr><td style="padding:4px 0;color:#6b7280;">Pickup Type</td><td style="padding:4px 0;text-align:right;">${details.pickupType === 'delivery' ? 'Delivery' : 'Self Pickup'}</td></tr>
          </table>
        </div>

        <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:16px;">
          <h3 style="margin:0 0 12px;font-size:14px;color:#111827;">Payment Summary</h3>
          <table style="width:100%;font-size:13px;color:#374151;">
            <tr><td style="padding:4px 0;color:#6b7280;">Rental</td><td style="padding:4px 0;text-align:right;">${formatCurrency(details.rentalPrice)}</td></tr>
            ${details.deliveryFee > 0 ? `<tr><td style="padding:4px 0;color:#6b7280;">Delivery Fee</td><td style="padding:4px 0;text-align:right;">${formatCurrency(details.deliveryFee)}</td></tr>` : ''}
            ${details.driverFee > 0 ? `<tr><td style="padding:4px 0;color:#6b7280;">Driver Fee</td><td style="padding:4px 0;text-align:right;">${formatCurrency(details.driverFee)}</td></tr>` : ''}
            <tr style="border-top:1px solid #e5e7eb;"><td style="padding:8px 0 4px;font-weight:700;color:#111827;">Total</td><td style="padding:8px 0 4px;text-align:right;font-weight:700;color:#111827;">${formatCurrency(details.totalPrice)}</td></tr>
          </table>
        </div>

        <p style="margin:0 0 8px;font-size:12px;color:#6b7280;">Payment Status: <strong style="color:#d97706;">Pending</strong></p>
        <p style="margin:0;font-size:12px;color:#6b7280;">Please complete your payment via GCash to confirm the booking. You will receive another email once payment is processed.</p>
      </div>
      <div style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="margin:0;font-size:11px;color:#9ca3af;">This is an automated email from Car Rental Service. Do not reply.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

    await transporter.sendMail({
      from: `"Car Rental" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: `Booking Confirmed - ${carName} (${booking.bookingId})`,
      html,
    });

    console.log(`[${formatDate()}] - Booking confirmation email sent to ${email} for ${booking.bookingId}`);
  } catch (error) {
    console.error(`[${formatDate()}] - Failed to send booking confirmation email:`, error.message);
  }
}

/**
 * Send payment success email
 */
async function sendPaymentSuccessEmail(booking) {
  if (!isEmailConfigured()) {
    console.log(`[${formatDate()}] - Email not configured, skipping payment success email`);
    return;
  }

  try {
    const details = booking.bookingDetails;
    const email = details.email;
    const firstName = details.firstName;
    const carName = booking.selectedCar?.name || 'Your Car';
    const amount = booking.paymentDetails?.amount || details.totalPrice;

    const transporter = createTransporter();

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="background:#059669;padding:24px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:20px;">Payment Successful</h1>
        <p style="color:#a7f3d0;margin:4px 0 0;font-size:13px;">Booking ID: ${booking.bookingId}</p>
      </div>
      <div style="padding:24px;">
        <p style="margin:0 0 16px;font-size:14px;color:#374151;">Hi <strong>${firstName}</strong>,</p>
        <p style="margin:0 0 20px;font-size:14px;color:#374151;">Your payment of <strong>${formatCurrency(amount)}</strong> has been received. Your booking for <strong>${carName}</strong> is now confirmed!</p>
        
        <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:16px;margin-bottom:16px;text-align:center;">
          <p style="margin:0;font-size:16px;font-weight:700;color:#059669;">PAID</p>
          <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">Payment processed successfully</p>
        </div>

        <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:16px;">
          <h3 style="margin:0 0 12px;font-size:14px;color:#111827;">Booking Summary</h3>
          <table style="width:100%;font-size:13px;color:#374151;">
            <tr><td style="padding:4px 0;color:#6b7280;">Car</td><td style="padding:4px 0;text-align:right;font-weight:600;">${carName}</td></tr>
            <tr><td style="padding:4px 0;color:#6b7280;">Pickup</td><td style="padding:4px 0;text-align:right;">${formatBookingDate(details.startDate)} at ${details.startTime}</td></tr>
            <tr><td style="padding:4px 0;color:#6b7280;">Return</td><td style="padding:4px 0;text-align:right;">${formatBookingDate(details.endDate)} at ${details.endTime}</td></tr>
            <tr><td style="padding:4px 0;color:#6b7280;">Amount Paid</td><td style="padding:4px 0;text-align:right;font-weight:700;color:#059669;">${formatCurrency(amount)}</td></tr>
          </table>
        </div>

        <p style="margin:0;font-size:12px;color:#6b7280;">The car owner will be notified and may contact you with pickup details. If you have questions, please reach out to the car owner directly.</p>
      </div>
      <div style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="margin:0;font-size:11px;color:#9ca3af;">This is an automated email from Car Rental Service. Do not reply.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

    await transporter.sendMail({
      from: `"Car Rental" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: `Payment Successful - ${carName} (${booking.bookingId})`,
      html,
    });

    console.log(`[${formatDate()}] - Payment success email sent to ${email} for ${booking.bookingId}`);
  } catch (error) {
    console.error(`[${formatDate()}] - Failed to send payment success email:`, error.message);
  }
}

/**
 * Send payment failed email
 */
async function sendPaymentFailedEmail(booking) {
  if (!isEmailConfigured()) {
    console.log(`[${formatDate()}] - Email not configured, skipping payment failed email`);
    return;
  }

  try {
    const details = booking.bookingDetails;
    const email = details.email;
    const firstName = details.firstName;
    const carName = booking.selectedCar?.name || 'Your Car';

    const transporter = createTransporter();

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="background:#dc2626;padding:24px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:20px;">Payment Failed</h1>
        <p style="color:#fecaca;margin:4px 0 0;font-size:13px;">Booking ID: ${booking.bookingId}</p>
      </div>
      <div style="padding:24px;">
        <p style="margin:0 0 16px;font-size:14px;color:#374151;">Hi <strong>${firstName}</strong>,</p>
        <p style="margin:0 0 20px;font-size:14px;color:#374151;">Unfortunately, your payment for <strong>${carName}</strong> could not be processed.</p>
        
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-bottom:16px;text-align:center;">
          <p style="margin:0;font-size:16px;font-weight:700;color:#dc2626;">PAYMENT FAILED</p>
          <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">Your booking is still on hold</p>
        </div>

        <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:16px;">
          <h3 style="margin:0 0 12px;font-size:14px;color:#111827;">What you can do</h3>
          <ul style="margin:0;padding-left:16px;font-size:13px;color:#374151;">
            <li style="margin-bottom:6px;">Check your GCash balance and try again</li>
            <li style="margin-bottom:6px;">Try a different payment method</li>
            <li style="margin-bottom:6px;">Contact your bank if the issue persists</li>
          </ul>
        </div>

        <div style="background:#f9fafb;border-radius:8px;padding:16px;">
          <table style="width:100%;font-size:13px;color:#374151;">
            <tr><td style="padding:4px 0;color:#6b7280;">Car</td><td style="padding:4px 0;text-align:right;font-weight:600;">${carName}</td></tr>
            <tr><td style="padding:4px 0;color:#6b7280;">Pickup</td><td style="padding:4px 0;text-align:right;">${formatBookingDate(details.startDate)} at ${details.startTime}</td></tr>
            <tr><td style="padding:4px 0;color:#6b7280;">Total</td><td style="padding:4px 0;text-align:right;font-weight:700;">${formatCurrency(details.totalPrice)}</td></tr>
          </table>
        </div>
      </div>
      <div style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="margin:0;font-size:11px;color:#9ca3af;">This is an automated email from Car Rental Service. Do not reply.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

    await transporter.sendMail({
      from: `"Car Rental" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: `Payment Failed - ${carName} (${booking.bookingId})`,
      html,
    });

    console.log(`[${formatDate()}] - Payment failed email sent to ${email} for ${booking.bookingId}`);
  } catch (error) {
    console.error(`[${formatDate()}] - Failed to send payment failed email:`, error.message);
  }
}

module.exports = {
  sendBookingConfirmationEmail,
  sendPaymentSuccessEmail,
  sendPaymentFailedEmail,
};
