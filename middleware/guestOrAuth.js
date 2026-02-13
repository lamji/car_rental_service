const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const Cashier = require('../models/Cashier');
const BlacklistedToken = require('../models/BlacklistedToken');

/**
 * Middleware that accepts both authenticated user tokens and guest tokens.
 * - If a valid user/cashier JWT is provided, attaches req.user as normal.
 * - If a valid guest JWT is provided, attaches req.user with guest info.
 * - If no token or invalid token, rejects with 401.
 */
const guestOrAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }

    // Check if token is blacklisted
    const isBlacklisted = await BlacklistedToken.findOne({ token });
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token has been invalidated. Please login again.',
      });
    }

    try {
      const decoded = verifyToken(token);

      // Guest token path
      if (decoded.type === 'guest') {
        req.user = {
          _id: decoded.id,
          role: 'guest',
          isGuest: true,
        };
        return next();
      }

      // Regular user/cashier token path
      let user = null;

      if (decoded.type === 'cashier') {
        user = await Cashier.findById(decoded.id);
      } else {
        user = await User.findById(decoded.id);
      }

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User not found or inactive',
        });
      }

      req.user = user;
      req.user.role = decoded.role;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { guestOrAuth };
