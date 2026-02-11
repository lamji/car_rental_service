/**
 * Socket.IO utilities - Main index file
 * Centralized exports for all Socket.IO event modules
 */

// Import all event modules
const { 
  emitCarHoldUpdate, 
  emitCarCreated
} = require('./carEvents');

const { 
  emitCarAvailabilityUpdate 
} = require('./availabilityEvents');

const { 
  emitCarUpdated
} = require('./updateEvents');

const { 
  emitCarDeleted
} = require('./deleteEvents');

const { 
  emitUserStatusUpdate, 
  emitUserProfileUpdate 
} = require('./userEvents');

const { 
  emitBookingStatusUpdate, 
  emitBookingCreated, 
  emitPaymentStatusUpdate 
} = require('./bookingEvents');

const {
  emitHoldWarning,
  emitHoldExpired,
} = require('./holdExpiryEvents');

// Re-export all functions for easy import
module.exports = {
  // Car events
  emitCarHoldUpdate,
  emitCarCreated,
  
  // Availability events
  emitCarAvailabilityUpdate,
  
  // Update events
  emitCarUpdated,
  
  // Delete events
  emitCarDeleted,
  
  // User events
  emitUserStatusUpdate,
  emitUserProfileUpdate,
  
  // Booking events
  emitBookingStatusUpdate,
  emitBookingCreated,
  emitPaymentStatusUpdate,

  // Hold expiry events
  emitHoldWarning,
  emitHoldExpired,
};
