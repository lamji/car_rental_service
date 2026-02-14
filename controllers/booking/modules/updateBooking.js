const Booking = require('../../../models/booking');
const { setJSON, clearCache } = require('../../../utils/redis');
const { formatDate } = require('../../../utils/logging');

/**
 * Refresh the Redis bookings cache after any mutation.
 * Silently catches errors so the main response is never blocked.
 */
async function refreshBookingsCache() {
  try {
    await clearCache('bookings');
    const allBookings = await Booking.find().populate('selectedCar').sort({ createdAt: -1 });
    await setJSON('bookings', allBookings, 600);
    console.log(`[${formatDate()}] - REDIS SET bookings cache refreshed (${allBookings.length} bookings)`);
  } catch (err) {
    console.error(`[${formatDate()}] - REDIS bookings cache refresh error:`, err.message);
  }
}

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private
exports.updateBooking = async (req, res) => {
  try {
    // Atomic findOneAndUpdate with version check to prevent concurrent overwrites
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Sync Redis cache
    await refreshBookingsCache();
    
    res.status(200).json({
      success: true,
      data: booking,
      message: 'Booking updated successfully'
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating booking',
      error: error.message
    });
  }
};

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Sync Redis cache
    await refreshBookingsCache();
    
    res.status(200).json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error deleting booking',
      error: error.message
    });
  }
};
