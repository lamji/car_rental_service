const express = require('express');
const router = express.Router();
const { sendAiOtp, verifyAiOtp, verifyAiSession } = require('../controllers/ai/aiOtp');

// @route   POST /api/ai/send-otp
// @desc    Send OTP to email for AI assistant booking verification
// @access  Public
router.post('/send-otp', sendAiOtp);

// @route   POST /api/ai/verify-otp
// @desc    Verify OTP for AI assistant booking lookup
// @access  Public
router.post('/verify-otp', verifyAiOtp);

// @route   POST /api/ai/verify-session
// @desc    Validate AI session token before allowing data access
// @access  Internal (called by Next.js proxy)
router.post('/verify-session', verifyAiSession);

module.exports = router;
