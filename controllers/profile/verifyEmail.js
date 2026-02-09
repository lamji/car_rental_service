const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const { generateToken, verifyToken } = require('../../utils/jwt');
const { formatDate, logError } = require('../../utils/logging');

// Redis toggle - set to false to disable Redis, true to enable
const USE_REDIS = process.env.USE_REDIS === 'true';

// Conditional Redis import
let redisUtils = null;
if (USE_REDIS) {
  try {
    redisUtils = require('../../utils/redis');
    console.log('🔴 Redis enabled for email verification');
  } catch (error) {
    console.log('🔴 Redis not available, falling back to memory storage');
  }
} else {
  console.log('🔴 Redis disabled for email verification, using memory storage');
}

/**
 * @desc    Verify email with OTP
 * @route   POST /api/profile/verify-email
 * @access  Private
 */
exports.verifyEmail = async (req, res) => {
  const startTime = Date.now();
  const startTimeFormatted = formatDate(startTime);
  const { otp, tempToken } = req.body;
  let email = null;
  let isTempTokenVerification = false;
  let usedRedis = false; // Track if Redis was used

  console.log(`\n[${startTimeFormatted}] - 📧 EMAIL VERIFICATION PROCESS STARTED | IP: ${req.ip}`);
  console.log(`[${startTimeFormatted}] - 📄 Request Body:`, JSON.stringify(req.body, null, 2));
  console.log(`[${startTimeFormatted}] - 🔍 Input Parameters | OTP: "${otp}" | TempToken: ${tempToken ? 'PRESENT' : 'MISSING'} | Redis Enabled: ${USE_REDIS}`);
  
  // Log token details for debugging
  if (tempToken) {
    console.log(`[${startTimeFormatted}] - 🔍 JWT_SECRET during verification: ${process.env.JWT_SECRET}`);
    try {
      const decoded = require('jsonwebtoken').decode(tempToken);
      console.log(`[${startTimeFormatted}] - 🔍 DECODED TOKEN:`, JSON.stringify(decoded, null, 2));
      console.log(`[${startTimeFormatted}] - 🔍 TOKEN EXPIRY: ${new Date(decoded.exp * 1000)} | CURRENT TIME: ${new Date()} | EXPIRED: ${Date.now() > decoded.exp * 1000}`);
    } catch (decodeError) {
      console.log(`[${startTimeFormatted}] - 🔍 TOKEN DECODE ERROR: ${decodeError.message}`);
    }
  }

  try {
    // Check if this is a temporary token verification (registration)
    if (tempToken) {
      try {
        const decoded = verifyToken(tempToken);
        
        // Validate this is a temporary email verification token
        if (decoded.type === 'email_verification' && decoded.temp) {
          email = decoded.email;
          isTempTokenVerification = true;
          console.log(`[${startTimeFormatted}] - 🔍 Temporary token verification for email: ${email}`);
        } else {
          return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
          });
        }
      } catch (tokenError) {
        console.log(`[${startTimeFormatted}] - 🔍 Token verification failed | Error: ${tokenError.message} | Token: ${tempToken.substring(0, 50)}...`);
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }
    }

    if (!otp || typeof otp !== 'string' || otp.trim().length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Valid 6-digit OTP is required'
      });
    }

    // Check for pending registration (Redis or Memory based on toggle)
    if (isTempTokenVerification && email) {
      let pendingReg = null;
      
      // Try Redis first if enabled
      if (USE_REDIS && redisUtils) {
        console.log(`[${startTimeFormatted}] - 🔍 Checking Redis for pending registration: ${email}`);
        
        const pendingRegCacheKey = `pending_registration:${email.toLowerCase()}`;
        pendingReg = await redisUtils.getJSON(pendingRegCacheKey);
        
        if (pendingReg) {
          console.log(`[${startTimeFormatted}] - 🎯 Redis cache HIT for pending registration: ${email}`);
          console.log(`[${startTimeFormatted}] - 🔍 REDIS PENDING REG DATA:`, JSON.stringify(pendingReg, null, 2));
          console.log(`[${startTimeFormatted}] - 🔍 REDIS OTP: "${pendingReg.emailVerificationOtp}" | EXPIRY: ${new Date(pendingReg.emailVerificationOtpExpiry)} | EXPIRED: ${new Date() > new Date(pendingReg.emailVerificationOtpExpiry)}`);
          usedRedis = true;
        } else {
          console.log(`[${startTimeFormatted}] - 🗄️ Redis cache MISS for pending registration: ${email}`);
        }
      }
      
      // Fallback to global memory storage if Redis not found or disabled
      if (!pendingReg && global.pendingRegistrations) {
        console.log(`[${startTimeFormatted}] - 🔍 Checking global memory storage for: ${email}`);
        console.log(`[${startTimeFormatted}] - 🔍 MEMORY STORAGE KEYS:`, Object.keys(global.pendingRegistrations));
        
        for (const [regEmail, regData] of Object.entries(global.pendingRegistrations)) {
          if (regEmail === email) {
            pendingReg = regData;
            console.log(`[${startTimeFormatted}] - 🎯 Memory storage HIT for pending registration: ${email}`);
            console.log(`[${startTimeFormatted}] - 🔍 MEMORY PENDING REG DATA:`, JSON.stringify(pendingReg, null, 2));
            console.log(`[${startTimeFormatted}] - 🔍 MEMORY OTP: "${pendingReg.emailVerificationOtp}" | EXPIRY: ${new Date(pendingReg.emailVerificationOtpExpiry)} | EXPIRED: ${new Date() > new Date(pendingReg.emailVerificationOtpExpiry)}`);
            break;
          }
        }
        
        if (!pendingReg) {
          console.log(`[${startTimeFormatted}] - 🗄️ Memory storage MISS for pending registration: ${email}`);
          
          // Try to get from Redis directly as fallback
          if (redisUtils) {
            try {
              const pendingRegCacheKey = `pending_registration:${email.toLowerCase()}`;
              pendingReg = await redisUtils.getJSON(pendingRegCacheKey);
              if (pendingReg) {
                console.log(`[${startTimeFormatted}] - 🎯 Redis fallback SUCCESS for pending registration: ${email}`);
                console.log(`[${startTimeFormatted}] - 🔍 REDIS FALLBACK PENDING REG DATA:`, JSON.stringify(pendingReg, null, 2));
                console.log(`[${startTimeFormatted}] - 🔍 REDIS FALLBACK OTP: "${pendingReg.emailVerificationOtp}" | EXPIRY: ${new Date(pendingReg.emailVerificationOtpExpiry)} | EXPIRED: ${new Date() > new Date(pendingReg.emailVerificationOtpExpiry)}`);
              }
            } catch (redisError) {
              console.log(`[${startTimeFormatted}] - 🔍 Redis fallback failed: ${redisError.message}`);
            }
          }
        }
      }
      
      // Process the pending registration if found
      if (pendingReg) {
        console.log(`[${startTimeFormatted}] - 🔍 OTP Verification | Provided: "${otp.trim()}" | Expected: "${pendingReg.emailVerificationOtp}" | Match: ${pendingReg.emailVerificationOtp === otp.trim()} | Expiry: ${new Date() <= new Date(pendingReg.emailVerificationOtpExpiry)} | Storage: ${usedRedis ? 'Redis' : 'Memory'}`);

        if (pendingReg.emailVerificationOtp === otp.trim() && 
            new Date() <= new Date(pendingReg.emailVerificationOtpExpiry)) {
          
          // Check if user already exists before creating
          const existingUser = await User.findOne({ email: pendingReg.email.toLowerCase().trim() });
          if (existingUser) {
            console.log(`[${startTimeFormatted}] - ⚠️ User already exists: ${pendingReg.email} - Cleaning up pending registration`);
            
            // Clean up pending registration from appropriate storage
            if (usedRedis && redisUtils) {
              const pendingRegCacheKey = `pending_registration:${email.toLowerCase()}`;
              await redisUtils.clearCache(pendingRegCacheKey);
              console.log(`[${startTimeFormatted}] - 🗑️ Pending registration cleared from Redis: ${email}`);
            } else {
              delete global.pendingRegistrations[email];
              console.log(`[${startTimeFormatted}] - 🗑️ Pending registration cleared from memory: ${email}`);
            }
            
            return res.status(409).json({
              success: false,
              message: 'Email already registered. Please login instead.',
              email: pendingReg.email
            });
          }
          
          // This is a valid registration OTP - create the user account and profile atomically
          const session = await mongoose.startSession();
          session.startTransaction();
          try {
            const user = await User.create([{
              name: pendingReg.name,
              email: pendingReg.email,
              password: pendingReg.password,
              emailVerified: true,
              emailVerifiedAt: new Date(),
              createdAtKey: pendingReg.createdAtKey,
              signupPlatform: pendingReg.signupPlatform || 'web'
            }], { session });

            const newUser = user[0];

            // Create corresponding profile document using service
            const { createDefaultProfile } = require('../../utils/profileService');
            await createDefaultProfile(newUser, pendingReg.name, pendingReg.createdAtKey, session);

            await session.commitTransaction();
            session.endSession();

            // Cache the new user data in Redis if enabled
            if (USE_REDIS && redisUtils) {
              const userCacheKey = `user:${newUser.email}`;
              await redisUtils.setJSON(userCacheKey, newUser.toObject(), 300);
              console.log(`[${startTimeFormatted}] - 💾 New user cached in Redis: ${newUser.email}`);
            }

            // Send welcome email asynchronously without blocking
            console.log('Sending welcome email to:', pendingReg.email);
            const welcomeEmailPromise = sendWelcomeEmailAsync(pendingReg.email, pendingReg.name);

            // Don't await welcome email - let it run in background
            welcomeEmailPromise.catch(error => {
              console.error('Background welcome email error:', error.message);
            });

            // Clean up pending registration from appropriate storage
            if (usedRedis && redisUtils) {
              const pendingRegCacheKey = `pending_registration:${email.toLowerCase()}`;
              await redisUtils.clearCache(pendingRegCacheKey);
              console.log(`[${startTimeFormatted}] - 🗑️ Pending registration cleared from Redis: ${email}`);
            } else {
              delete global.pendingRegistrations[email];
              console.log(`[${startTimeFormatted}] - 🗑️ Pending registration cleared from memory: ${email}`);
            }

            // Generate JWT token with role included
            const token = generateToken({ 
              id: newUser._id,
              role: newUser.role 
            });

            const responseTime = Date.now() - startTime;
            console.log(`[${startTimeFormatted}] - ✅ REGISTRATION VERIFICATION SUCCESSFUL | Total time: ${responseTime}ms | Storage: ${usedRedis ? 'Redis' : 'Memory'}`);

            return res.status(201).json({
              success: true,
              message: 'Registration completed successfully',
              token,
              user: {
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                emailVerified: newUser.emailVerified,
                emailVerifiedAt: newUser.emailVerifiedAt,
                createdAt: newUser.createdAt
              },
              createdAtKey: pendingReg.createdAtKey,
              userName:pendingReg.name
            });
          } catch (error) {
            console.error(`[${startTimeFormatted}] - 💥 Transaction Error: ${error.message}`);
            try {
              await session.abortTransaction();
            } catch (abortError) {
              console.error(`[${startTimeFormatted}] - 💥 Abort Transaction Error: ${abortError.message}`);
            }
            try {
              session.endSession();
            } catch (sessionError) {
              console.error(`[${startTimeFormatted}] - 💥 End Session Error: ${sessionError.message}`);
            }
            console.error('Error creating user during registration verification:', error);
            return res.status(500).json({
              success: false,
              message: 'Failed to complete registration. Please try again.'
            });
          }
        } else {
          console.log(`[${startTimeFormatted}] - ❌ Invalid or expired OTP for pending registration: ${email}`);
          console.log(`[${startTimeFormatted}] - 🔍 OTP Details | Provided: "${otp.trim()}" | Expected: "${pendingReg.emailVerificationOtp}" | Match: ${pendingReg.emailVerificationOtp === otp.trim()} | Current Time: ${new Date()} | Expiry Time: ${new Date(pendingReg.emailVerificationOtpExpiry)} | Is Expired: ${new Date() > new Date(pendingReg.emailVerificationOtpExpiry)} | Storage: ${usedRedis ? 'Redis' : 'Memory'}`);
        }
      } else {
        console.log(`[${startTimeFormatted}] - ❌ No pending registration found for email: ${email} | Storage: ${USE_REDIS ? 'Redis' : 'Memory'}`);
      }
    }

    // If not a registration verification, proceed with profile email verification
    // Only check profile if this is not a temporary token verification
    if (!isTempTokenVerification) {
      console.log(`[${startTimeFormatted}] - 🔍 Profile verification flow for user: ${req.user.id}`);
      
      let profile = await Profile.findOne({ userId: req.user.id }).lean();
      
      console.log(`[${startTimeFormatted}] - Profile found: ${!!profile} | Email verified: ${profile?.emailVerified}`);
      
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found'
        });
      }

      // If email is already verified, return success
      if (profile.emailVerified) {
        const responseTime = Date.now() - startTime;
        console.log(`[${startTimeFormatted}] - ✅ EMAIL ALREADY VERIFIED | Total time: ${responseTime}ms | Redis: ${usedRedis}`);
        return res.status(200).json({
          success: true,
          message: 'Email is already verified',
          profile
        });
      }

      // Check if OTP exists and is not expired
      if (!profile.emailVerificationOtp || !profile.emailVerificationOtpExpiry) {
        return res.status(400).json({
          success: false,
          message: 'No verification code found. Please request a new one.'
        });
      }

      if (new Date() > profile.emailVerificationOtpExpiry) {
        return res.status(400).json({
          success: false,
          message: 'Verification code has expired. Please request a new verification code.'
        });
      }

      // Check if OTP matches
      if (profile.emailVerificationOtp !== otp.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid verification code'
        });
      }

      // Check OTP attempts
      if (profile.emailVerificationOtpAttempts >= 3) {
        return res.status(429).json({
          success: false,
          message: 'Too many failed attempts. Please request a new verification code.'
        });
      }

      // Update profile with verified email
      const updatedProfile = await Profile.findOneAndUpdate(
        { userId: req.user.id },
        {
          $set: {
            email: profile.pendingEmail,
            emailVerified: true,
            emailVerifiedAt: new Date(),
            updatedAt: new Date()
          },
          $unset: {
            pendingEmail: 1,
            emailVerificationOtp: 1,
            emailVerificationOtpExpiry: 1,
            emailVerificationOtpAttempts: 1,
            emailVerificationOtpLastAttempt: 1
          }
        },
        { new: true, runValidators: true }
      ).select('-_id -userId');

      // Also update the User model
      await User.findByIdAndUpdate(req.user.id, {
        $set: {
          emailVerified: true,
          emailVerifiedAt: new Date()
        }
      });

      // Cache the updated user data in Redis if enabled
      if (USE_REDIS && redisUtils) {
        const updatedUser = await User.findById(req.user.id).lean();
        const userCacheKey = `user:${updatedUser.email}`;
        await redisUtils.setJSON(userCacheKey, updatedUser, 300);
        console.log(`[${startTimeFormatted}] - 💾 Updated user cached in Redis: ${updatedUser.email}`);
      }

      const responseTime = Date.now() - startTime;
      console.log(`[${startTimeFormatted}] - ✅ PROFILE EMAIL VERIFICATION SUCCESSFUL | Total time: ${responseTime}ms | Storage: ${USE_REDIS ? 'Redis' : 'Memory'}`);

      return res.status(200).json({
        success: true,
        message: 'Email verified successfully',
        profile: updatedProfile
      });
    }

    // If we reach here with tempToken but no matching registration was found
    if (isTempTokenVerification) {
      console.log(`[${startTimeFormatted}] - ❌ No pending registration found for email: ${email}`);
      console.log(`[${startTimeFormatted}] - 🔍 Verification Details | Email: ${email} | TempToken: ${tempToken ? 'VALID' : 'INVALID'} | OTP: "${otp}" | Storage: ${USE_REDIS ? 'Redis' : 'Memory'}`);
      
      // Check if pending registration exists in Redis (for debugging)
      if (email && USE_REDIS && redisUtils) {
        const pendingRegCacheKey = `pending_registration:${email.toLowerCase()}`;
        const checkPendingReg = await redisUtils.getJSON(pendingRegCacheKey);
        console.log(`[${startTimeFormatted}] - 🔍 Redis Check | Cache Key: ${pendingRegCacheKey} | Found: ${!!checkPendingReg}`);
        
        if (checkPendingReg) {
          console.log(`[${startTimeFormatted}] - 🔍 Pending Registration Data:`, {
            email: checkPendingReg.email,
            otp: checkPendingReg.emailVerificationOtp,
            expiry: checkPendingReg.emailVerificationOtpExpiry,
            isExpired: new Date() > new Date(checkPendingReg.emailVerificationOtpExpiry)
          });
        }
      }
      
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
    }

    // Regular flow - no tempToken and no registration found
    console.log(`[${startTimeFormatted}] - ❌ User not found or inactive`);
    return res.status(404).json({
      success: false,
      message: 'User not found or inactive'
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`[${startTimeFormatted}] - 💥 EMAIL VERIFICATION ERROR | Total time: ${responseTime}ms | Storage: ${USE_REDIS ? 'Redis' : 'Memory'}`);
    logError(`📝 Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Send welcome email asynchronously without blocking the verification process
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 */
async function sendWelcomeEmailAsync(email, name) {
  const emailStartTime = Date.now();
  const { formatDate } = require('../../utils/logging');
  
  try {
    const nodemailer = require('nodemailer');
    
    // Create transporter based on service (optimized for performance)
    let transporter;
    
    if (process.env.EMAIL_SERVICE === 'gmail') {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        // Connection pooling for better performance
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 1000,
        rateLimit: 5
      });
    } else if (process.env.EMAIL_SERVICE === 'ethereal') {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        },
        pool: true,
        maxConnections: 3,
        maxMessages: 50
      });
      console.log('Ethereal test account:', testAccount);
    } else if (process.env.EMAIL_SERVICE === 'namecheap') {
      transporter = nodemailer.createTransport({
        host: 'mail.privateemail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 2000,
        rateLimit: 3
      });
    } else {
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100
      });
    }

    const welcomeEmailContent = {
      from: `"${process.env.STORE_NAME}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: `Welcome to ${process.env.STORE_NAME}! 🎉`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to ${process.env.STORE_NAME}!</h2>
          <p>Hi ${name},</p>
          <p>Your registration is complete. Welcome aboard!</p>
          <p>We're excited to have you join our community. Here's what you can do next:</p>
          <ul>
            <li>Explore our features</li>
            <li>Complete your profile</li>
            <li>Start using our services</li>
          </ul>
          <p>If you have any questions, feel free to reach out to our support team.</p>
          <hr style="border: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `
    };

    const result = await transporter.sendMail(welcomeEmailContent);
    const emailTime = Date.now() - emailStartTime;
    console.log(`[${formatDate()}] - 📧 Welcome email sent successfully to: ${email} | Time: ${emailTime}ms`);
    
    // If using Ethereal, show preview URL
    if (process.env.EMAIL_SERVICE === 'ethereal' && result.messageId) {
      console.log('Welcome email preview URL:', nodemailer.getTestMessageUrl(result));
    }
    
    // Close connection pool to free resources
    transporter.close();
    
    return { success: true, message: 'Welcome email sent successfully', time: emailTime };
  } catch (emailError) {
    const emailTime = Date.now() - emailStartTime;
    console.error(`[${formatDate()}] - 📧 Welcome email sending failed for ${email} | Time: ${emailTime}ms | Error: ${emailError.message}`);
    
    return { 
      success: false, 
      error: emailError.message,
      time: emailTime
    };
  }
}
