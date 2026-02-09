// Management modules index file
// This file provides easy access to all car management functions

module.exports = {
  // Availability management
  updateAvailability: require('./availability').updateAvailability,
  updateHoldStatus: require('./availability').updateHoldStatus,
  
  // Date management
  addUnavailableDates: require('./dates').addUnavailableDates,
  removeUnavailableDates: require('./dates').removeUnavailableDates,
  
  // Statistics management
  incrementRentedCount: require('./stats').incrementRentedCount,
  
  // Rating management
  updateRating: require('./rating').updateRating
};
