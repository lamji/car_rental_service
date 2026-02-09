/**
 * User-related Socket.IO event emitters
 * Modularized for better scalability
 */

const { formatDate } = require('../logging');

/**
 * Emits user status update to connected clients
 * @param {Object} io - Socket.io instance
 * @param {Object} user - Updated user object
 * @param {string} action - Action performed (online/offline/away)
 */
function emitUserStatusUpdate(io, user, action) {
  try {
    const payload = {
      event: 'user_status_updated',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          status: action
        },
        action,
        timestamp: new Date().toISOString()
      }
    };

    // Emit to all connected clients
    io.emit('user_status_updated', payload);
    
    // Emit to specific user room
    io.to(`user:${user.id}`).emit('user_status_updated', payload);
    
    // Emit to admin room
    io.to('admin').emit('user_status_updated', payload);
    
    console.log(`\n[${formatDate()}] - 📡 USER STATUS EMITTED | User: ${user.id} | Status: ${action}`);
    
  } catch (error) {
    console.error(`[${formatDate()}] - 🔴 ERROR EMITTING USER STATUS:`, error);
  }
}

/**
 * Emits user profile update to connected clients
 * @param {Object} io - Socket.io instance
 * @param {Object} user - Updated user object
 */
function emitUserProfileUpdate(io, user) {
  try {
    const payload = {
      event: 'user_profile_updated',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar
        },
        timestamp: new Date().toISOString()
      }
    };

    // Emit to specific user room
    io.to(`user:${user.id}`).emit('user_profile_updated', payload);
    
    console.log(`\n[${formatDate()}] - 📡 USER PROFILE EMITTED | User: ${user.id}`);
    
  } catch (error) {
    console.error(`[${formatDate()}] - 🔴 ERROR EMITTING USER PROFILE:`, error);
  }
}

module.exports = {
  emitUserStatusUpdate,
  emitUserProfileUpdate
};
