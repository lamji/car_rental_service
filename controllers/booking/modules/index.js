// Booking controller modules index file
// This file provides easy access to all booking controller functions

module.exports = {
  // Create operations
  createBooking: require('./createBooking').createBooking,
  
  // Read operations
  getBookings: require('./getBookings').getBookings,
  getBookingById: require('./getBookingById').getBookingById,
  getBookingByBookingId: require('./getBookingById').getBookingByBookingId,
  getUserBookings: require('./getSpecificBookings').getUserBookings,
  getCarBookings: require('./getSpecificBookings').getCarBookings,
  
  // Update operations
  updateBooking: require('./updateBooking').updateBooking,
  updatePaymentStatus: require('./updateStatus').updatePaymentStatus,
  updateBookingStatus: require('./updateStatus').updateBookingStatus,
  
  // Delete operations
  deleteBooking: require('./updateBooking').deleteBooking
};
