const { v4: uuidv4 } = require('uuid');
const { generateToken } = require('../../utils/jwt');

/**
 * @desc    Generate a guest token for unauthenticated users
 * @route   POST /api/auth/guest-token
 * @access  Public (restricted to allowed origins)
 */
exports.generateGuestToken = async (req, res) => {
  try {
    // Validate API key — prevents unauthorized direct API calls
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.GUEST_API_KEY) {
      console.warn(`Guest token rejected - invalid or missing API key`);
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const guestId = `guest_${uuidv4()}`;

    const token = generateToken({
      id: guestId,
      role: 'guest',
      type: 'guest',
    }, '24h');

    res.status(200).json({
      success: true,
      token,
      guestId,
      message: 'Guest token generated successfully',
    });
  } catch (error) {
    console.error('Error generating guest token:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating guest token',
      error: error.message,
    });
  }
};
