const { getJSON, setJSON, del } = require('../../utils/redis');

/**
 * AI Assistant OTP Service
 * Exclusive OTP system for AI assistant booking lookups.
 * Uses Redis for OTP storage (no User model dependency).
 * Reuses the same nodemailer transporter pattern from auth controllers.
 */

function generateOtp() {
  const timestamp = Date.now().toString().slice(-3);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return timestamp + random;
}

function createTransporter() {
  const nodemailer = require('nodemailer');

  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else if (process.env.EMAIL_SERVICE === 'ethereal') {
    // Ethereal is async, handled separately
    return null;
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

/**
 * Send OTP to email for AI assistant booking verification
 * POST /api/ai/send-otp
 * Body: { email }
 */
async function sendAiOtp(req, res) {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Valid email is required'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limit: max 3 OTP requests per email per 10 minutes
    const rateLimitKey = `ai_otp_rate:${normalizedEmail}`;
    const rateCount = await getJSON(rateLimitKey);
    if (rateCount && rateCount >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Too many OTP requests. Please wait a few minutes before trying again.'
      });
    }

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in Redis only (no DB dependency)
    const otpCacheKey = `ai_assistant_otp:${normalizedEmail}`;
    await setJSON(otpCacheKey, {
      otp,
      expiry: otpExpiry.toISOString(),
      email: normalizedEmail,
      attempts: 0
    }, 600); // 10 minutes TTL

    // Increment rate limit counter
    await setJSON(rateLimitKey, (rateCount || 0) + 1, 600);

    // Send email
    if (!process.env.EMAIL_SERVICE || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('[AI OTP] Email service not configured');
      return res.status(200).json({
        success: true,
        message: 'Verification code generated',
        // In development, include OTP for testing
        ...(process.env.NODE_ENV === 'development' && { otp })
      });
    }

    const nodemailer = require('nodemailer');
    let transporter = createTransporter();

    // Handle Ethereal (async account creation)
    if (!transporter && process.env.EMAIL_SERVICE === 'ethereal') {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    }

    const emailContent = {
      from: `"${process.env.STORE_NAME || 'Renty'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: normalizedEmail,
      subject: 'Your Booking Verification Code - Renty AI Assistant',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Renty AI Assistant</h2>
          <p>Hi,</p>
          <p>You requested to view your booking details through our AI assistant. Your verification code is:</p>
          <div style="background: #eff6ff; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; border: 1px solid #bfdbfe;">
            <span style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #1d4ed8;">${otp}</span>
          </div>
          <p>This code will expire in <strong>10 minutes</strong>.</p>
          <p style="color: #6b7280; font-size: 13px;">If you didn't request this code, please ignore this email. Someone may have entered your email by mistake.</p>
          <hr style="border: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 11px;">
            This is an automated message from Renty AI Assistant. Do not reply to this email.
          </p>
        </div>
      `
    };

    const result = await transporter.sendMail(emailContent);

    if (process.env.EMAIL_SERVICE === 'ethereal' && result.messageId) {
      console.log('[AI OTP] Ethereal preview:', nodemailer.getTestMessageUrl(result));
    }

    console.log(`[AI OTP] Verification code sent to ${normalizedEmail}`);

    return res.status(200).json({
      success: true,
      message: 'Verification code sent to your email'
    });

  } catch (error) {
    console.error('[AI OTP] Error sending OTP:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send verification code. Please try again.'
    });
  }
}

/**
 * Verify OTP for AI assistant booking lookup
 * POST /api/ai/verify-otp
 * Body: { email, otp }
 * Returns a short-lived session token on success
 */
async function verifyAiOtp(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const otpCacheKey = `ai_assistant_otp:${normalizedEmail}`;
    const cached = await getJSON(otpCacheKey);

    if (!cached) {
      return res.status(400).json({
        success: false,
        message: 'No verification code found. It may have expired. Please request a new one.'
      });
    }

    // Check max attempts (5 attempts max)
    if (cached.attempts >= 5) {
      await del(otpCacheKey);
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. Please request a new verification code.'
      });
    }

    // Check expiry
    if (new Date() > new Date(cached.expiry)) {
      await del(otpCacheKey);
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.'
      });
    }

    // Verify OTP
    if (cached.otp !== otp.trim()) {
      // Increment attempts
      cached.attempts = (cached.attempts || 0) + 1;
      await setJSON(otpCacheKey, cached, 600);
      return res.status(400).json({
        success: false,
        message: `Invalid code. ${5 - cached.attempts} attempt(s) remaining.`
      });
    }

    // OTP is valid - clear it and create a session token
    await del(otpCacheKey);

    // Create a short-lived session in Redis (15 minutes)
    const sessionToken = require('crypto').randomBytes(32).toString('hex');
    const sessionKey = `ai_session:${sessionToken}`;
    await setJSON(sessionKey, {
      email: normalizedEmail,
      verified: true,
      createdAt: new Date().toISOString()
    }, 900); // 15 minutes TTL

    console.log(`[AI OTP] Verified successfully for ${normalizedEmail}`);

    return res.status(200).json({
      success: true,
      message: 'Verification successful',
      sessionToken
    });

  } catch (error) {
    console.error('[AI OTP] Error verifying OTP:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify code. Please try again.'
    });
  }
}

/**
 * Validate AI session token before allowing booking data access
 * Used internally by booking lookup endpoint
 */
async function validateAiSession(sessionToken) {
  if (!sessionToken) return null;
  const sessionKey = `ai_session:${sessionToken}`;
  const session = await getJSON(sessionKey);
  if (!session || !session.verified) return null;
  return session;
}

/**
 * Verify AI session endpoint (called by Next.js proxy)
 * POST /api/ai/verify-session
 * Body: { sessionToken, email }
 */
async function verifyAiSession(req, res) {
  try {
    const { sessionToken, email } = req.body;

    if (!sessionToken || !email) {
      return res.status(400).json({ valid: false, message: 'Session token and email required' });
    }

    const session = await validateAiSession(sessionToken);
    if (!session) {
      return res.status(200).json({ valid: false, message: 'Session expired or invalid' });
    }

    // Ensure the session email matches the requested email
    if (session.email !== email.toLowerCase().trim()) {
      return res.status(200).json({ valid: false, message: 'Email does not match verified session' });
    }

    return res.status(200).json({ valid: true });
  } catch (error) {
    console.error('[AI OTP] Session validation error:', error);
    return res.status(500).json({ valid: false, message: 'Session validation failed' });
  }
}

module.exports = { sendAiOtp, verifyAiOtp, validateAiSession, verifyAiSession };
