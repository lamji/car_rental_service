const Car = require("../../../models/car");
const { getJSON, setJSON } = require("../../../utils/redis");
const { emitCarHoldUpdate } = require("../../../utils/socket");
const { startHoldCountdown, getUserAgentRoom, getActiveHold, autoReleaseBooking } = require("../../../utils/holdCountdown");

// Helper function to check if date is already unavailable in cache
function checkDateUnavailable(cachedCars, id, startDate, endDate, startTime, endTime) {
  const cachedCar = cachedCars.data.find(
    (car) => car._id.toString() === id,
  );
  const unavailableDates = cachedCar?.availability?.unavailableDates || [];

  // Check if requested booking falls within any existing unavailable time frame
  return unavailableDates.some(
    (existing) => {
      // Check if same date and time overlaps (including start time equal to end time)
      const sameDate = existing.startDate === startDate;
      const timeOverlap = startTime >= existing.startTime && startTime <= existing.endTime;
      
      return sameDate && timeOverlap;
    }
  );
}

const bookingLogic = (car, startDate, endDate, startTime, endTime) => {
  // Create mock cachedCars structure for the helper function
  const mockCachedCars = { data: [car] };
  
  const isDateUnavailable = checkDateUnavailable(
    mockCachedCars,
    car._id.toString(),
    startDate,
    endDate,
    startTime,
    endTime,
  );

  
  // Dynamic return - for now just return boolean, but can be extended
  return {
    status: isDateUnavailable ? 'unavailable' : 'available',
    isDateUnavailable,
    car: car._id,
    requestedDates: {
      startDate,
      endDate,
      startTime,
      endTime
    }
  };
};

// @desc    Hold car dates temporarily to prevent double booking
// @route   POST /api/cars/hold-date/:id
// @access  Public
exports.holdCarDates = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, startTime, endTime } = req.body;
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Validate required fields
    if (!startDate || !endDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Start date, end date, start time, and end time are required",
      });
    }

    // Release any existing hold from the same userAgent on this car
    // This prevents "date unavailable" errors when the user changes dates/times
    const existingHold = getActiveHold(userAgent);
    if (existingHold && existingHold.carId === id && existingHold.bookingId) {
      console.log(`[holdCarDates] Releasing previous hold for userAgent before new hold. BookingId: ${existingHold.bookingId}`);
      await autoReleaseBooking(id, existingHold.bookingId);
    }

    // Create booking entry with userAgent for tracking
    const bookingEntry = {
      startDate,
      endDate,
      startTime,
      endTime,
      userAgent,
      createdAt: new Date()
    };

    // Fetch car from redis (re-fetch after potential release to get fresh data)
    const cachedCar = await getJSON(`car:${id}`);
    
    if (cachedCar) {
      console.log('Redis cache HIT for car:', id);
      const bookingResult = bookingLogic(cachedCar, startDate, endDate, startTime, endTime);
      
      if (bookingResult.isDateUnavailable) {
        return res.status(409).json({
          success: false,
          message: "Date is unavailable",
          data: bookingResult
        });
      }
      
      // Use atomic operation to update database and prevent race conditions
      const updatedCar = await Car.findOneAndUpdate(
        {
          _id: id,
          isActive: true,
          // Ensure no overlapping booking exists (double-check)
          $nor: [
            {
              'availability.unavailableDates': {
                $elemMatch: {
                  startDate: startDate,
                  $or: [
                    { 
                      $and: [
                        { startTime: { $lte: endTime } },
                        { endTime: { $gte: startTime } }
                      ]
                    }
                  ]
                }
              }
            }
          ]
        },
        {
          $push: { 'availability.unavailableDates': bookingEntry },
          $set: { updatedAt: new Date() }
        },
        { new: true }
      );

      if (!updatedCar) {
        return res.status(409).json({
          success: false,
          message: "Date is no longer available - please try again",
          data: {
            status: 'unavailable',
            isDateUnavailable: true,
            car: id,
            requestedDates: {
              startDate,
              endDate,
              startTime,
              endTime
            }
          }
        });
      }
      
      // Emit real-time update to connected clients
      emitCarHoldUpdate(global.io, updatedCar, 'hold', `Car dates held: ${startDate} ${startTime} to ${endDate} ${endTime}`);
      
      // Update Redis cache with fresh data
      await setJSON(`car:${id}`, updatedCar, 300);
      
      // Also clear main cars cache to ensure consistency
      const { clearCache } = require("../../../utils/redis");
      await clearCache('cars');
      
      // Find the newly added booking to get its _id
      const newBookingWithId = updatedCar.availability.unavailableDates.find(
        booking => booking.startDate === startDate && 
                  booking.endDate === endDate && 
                  booking.startTime === startTime && 
                  booking.endTime === endTime
      );
      
      // Start 2-minute hold countdown
      const holdInfo = startHoldCountdown({
        userAgent,
        carId: id,
        bookingId: newBookingWithId?._id?.toString() || '',
        bookingDetails: { startDate, endDate, startTime, endTime },
      });

      return res.status(200).json({
        success: true,
        message: "Car found in cache and booking confirmed",
        data: cachedCar,
        booking: bookingResult,
        newBooking: newBookingWithId || bookingEntry,
        hold: {
          room: holdInfo.room,
          expiresAt: holdInfo.expiresAt,
          durationMs: 120000,
        },
      });
    }
    
    // else check the db
    console.log('Redis cache MISS for car:', id, '- checking database');
    const car = await Car.findOne({ _id: id, isActive: true });
    
    if (car) {
      console.log('Found car in database, caching to Redis:', id);
      const bookingResult = bookingLogic(car, startDate, endDate, startTime, endTime);
      
      if (bookingResult.isDateUnavailable) {
        return res.status(409).json({
          success: false,
          message: "Date is unavailable",
          data: bookingResult
        });
      }
      
      // Use atomic operation to update database and prevent race conditions
      const updatedCar = await Car.findOneAndUpdate(
        {
          _id: id,
          isActive: true,
          // Ensure no overlapping booking exists (double-check)
          $nor: [
            {
              'availability.unavailableDates': {
                $elemMatch: {
                  startDate: startDate,
                  $or: [
                    { 
                      $and: [
                        { startTime: { $lte: endTime } },
                        { endTime: { $gte: startTime } }
                      ]
                    }
                  ]
                }
              }
            }
          ]
        },
        {
          $push: { 'availability.unavailableDates': bookingEntry },
          $set: { updatedAt: new Date() }
        },
        { new: true }
      );

      if (!updatedCar) {
        return res.status(409).json({
          success: false,
          message: "Date is no longer available - please try again",
          data: {
            status: 'unavailable',
            isDateUnavailable: true,
            car: id,
            requestedDates: {
              startDate,
              endDate,
              startTime,
              endTime
            }
          }
        });
      }
      
      // Emit real-time update to connected clients
      emitCarHoldUpdate(global.io, updatedCar, 'hold', `Car dates held: ${startDate} ${startTime} to ${endDate} ${endTime}`);
      
      // Update Redis cache with fresh data
      await setJSON(`car:${id}`, updatedCar, 300);
      
      // Also clear main cars cache to ensure consistency
      const { clearCache } = require("../../../utils/redis");
      await clearCache('cars');
      
      // Find the newly added booking to get its _id
      const newBookingWithId = updatedCar.availability.unavailableDates.find(
        booking => booking.startDate === startDate && 
                  booking.endDate === endDate && 
                  booking.startTime === startTime && 
                  booking.endTime === endTime
      );
      
      // Start 2-minute hold countdown
      const holdInfo = startHoldCountdown({
        userAgent,
        carId: id,
        bookingId: newBookingWithId?._id?.toString() || '',
        bookingDetails: { startDate, endDate, startTime, endTime },
      });

      return res.status(200).json({
        success: true,
        message: "Car found in database and booking confirmed",
        data: car,
        booking: bookingResult,
        newBooking: newBookingWithId || bookingEntry,
        hold: {
          room: holdInfo.room,
          expiresAt: holdInfo.expiresAt,
          durationMs: 120000,
        },
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Car not found"
      });
    }
  } catch (error) {
    console.error("Error holding car dates:", error);
    res.status(500).json({
      success: false,
      message: "Server error while holding car dates",
    });
  }
};





