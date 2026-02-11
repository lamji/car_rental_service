const Car = require("../../../models/car");
const { getJSON, setJSON } = require("../../../utils/redis");
const { emitCarHoldUpdate } = require("../../../utils/socket");

// @desc    Release/remove specific car dates from unavailableDates
// @route   DELETE /api/cars/release-date/:id
// @access  Public
exports.releaseCarDates = async (req, res) => {
  try {
    const { id } = req.params;
    const { bookingId } = req.body; // The _id of the booking to remove

    // Validate required field
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    // Simple logic: check if car id is available in redis
    const cachedCar = await getJSON(`car:${id}`);
    
    if (cachedCar) {
      // if yes return it
      console.log('🎯 Redis cache HIT for car:', id);
      
      // Check if booking exists in unavailableDates
      const unavailableDates = cachedCar.availability?.unavailableDates || [];
      const bookingToRemove = unavailableDates.find(booking => 
        booking._id.toString() === bookingId.toString()
      );
      
      if (!bookingToRemove) {
        return res.status(404).json({
          success: false,
          message: "Booking not found in unavailable dates",
        });
      }
      
      // Use atomic operation to remove booking and prevent race conditions
      const updatedCar = await Car.findOneAndUpdate(
        {
          _id: id,
          isActive: true,
          // Ensure the booking still exists (double-check)
          'availability.unavailableDates._id': bookingId
        },
        {
          $pull: { 'availability.unavailableDates': { _id: bookingId } },
          $set: { updatedAt: new Date() }
        },
        { new: true }
      );

      if (!updatedCar) {
        return res.status(409).json({
          success: false,
          message: "Unable to release booking - please try again"
        });
      }
      
      // Emit real-time update to connected clients
      emitCarHoldUpdate(global.io, updatedCar, 'release', `Car dates released: ${bookingToRemove.startDate} ${bookingToRemove.startTime} to ${bookingToRemove.endDate} ${bookingToRemove.endTime}`);
      
      // Update Redis cache with fresh data
      await setJSON(`car:${id}`, updatedCar, 300);
      
      // Also clear main cars cache to ensure consistency
      const { clearCache } = require("../../../utils/redis");
      await clearCache('cars');
      
      return res.status(200).json({
        success: true,
        message: "Car found in cache and booking released successfully",
        data: cachedCar,
        removedBooking: bookingToRemove,
        updatedUnavailableDates: updatedCar.availability?.unavailableDates || []
      });
    }
    
    // else check the db
    console.log('🔍 Redis cache MISS for car:', id, '- checking database');
    const car = await Car.findOne({ _id: id, isActive: true });
    
    if (car) {
      // Check if booking exists in unavailableDates
      const unavailableDates = car.availability?.unavailableDates || [];
      const bookingToRemove = unavailableDates.find(booking => 
        booking._id.toString() === bookingId.toString()
      );
      
      if (!bookingToRemove) {
        return res.status(404).json({
          success: false,
          message: "Booking not found in unavailable dates",
        });
      }
      
      // Use atomic operation to remove booking and prevent race conditions
      const updatedCar = await Car.findOneAndUpdate(
        {
          _id: id,
          isActive: true,
          // Ensure the booking still exists (double-check)
          'availability.unavailableDates._id': bookingId
        },
        {
          $pull: { 'availability.unavailableDates': { _id: bookingId } },
          $set: { updatedAt: new Date() }
        },
        { new: true }
      );

      if (!updatedCar) {
        return res.status(409).json({
          success: false,
          message: "Unable to release booking - please try again"
        });
      }
      
      // Emit real-time update to connected clients
      emitCarHoldUpdate(global.io, updatedCar, 'release', `Car dates released: ${bookingToRemove.startDate} ${bookingToRemove.startTime} to ${bookingToRemove.endDate} ${bookingToRemove.endTime}`);
      
      // Update Redis cache with fresh data
      await setJSON(`car:${id}`, updatedCar, 300);
      
      // Also clear main cars cache to ensure consistency
      const { clearCache } = require("../../../utils/redis");
      await clearCache('cars');
      
      return res.status(200).json({
        success: true,
        message: "Car found in database and booking released successfully",
        data: car,
        removedBooking: bookingToRemove,
        updatedUnavailableDates: updatedCar.availability?.unavailableDates || []
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Car not found"
      });
    }
  } catch (error) {
    console.error("Error releasing car dates:", error);
    res.status(500).json({
      success: false,
      message: "Server error while releasing car dates",
    });
  }
};
