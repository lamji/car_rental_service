const Car = require("../../../models/car");
const { getJSON, setJSON } = require("../../../utils/redis");

// Helper function to check if date is already unavailable in cache
function checkDateUnavailable(cachedCars, id, startDate, endDate, startTime, endTime) {
  const cachedCar = cachedCars.data.find(
    (car) => car._id.toString() === id,
  );
  const unavailableDates = cachedCar?.availability?.unavailableDates || [];

  // Check if requested dates already exist in unavailableDates
  return unavailableDates.some(
    (existing) =>
      existing.startDate === startDate &&
      existing.endDate === endDate &&
      existing.startTime === startTime &&
      existing.endTime === endTime,
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
  console.log("🎯 Booking logic:", {
    isDateUnavailable,
    startDate,
    endDate,
    startTime,
    endTime,
  });
  
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

    // Validate required fields
    if (!startDate || !endDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Start date, end date, start time, and end time are required",
      });
    }

    // Simple logic: check if car id is available in redis
    const cachedCar = await getJSON(`car:${id}`);
    
    if (cachedCar) {
      // if yes return it
      console.log('🎯 Redis cache HIT for car:', id);
      const bookingResult = bookingLogic(cachedCar, startDate, endDate, startTime, endTime);
      
      if (bookingResult.isDateUnavailable) {
        return res.status(409).json({
          success: false,
          message: "Date is unavailable",
          data: bookingResult
        });
      }
      
      return res.status(200).json({
        success: true,
        message: "Car found in cache",
        data: cachedCar,
        booking: bookingResult
      });
    }
    
    // else check the db
    console.log('🔍 Redis cache MISS for car:', id, '- checking database');
    const car = await Car.findOne({ _id: id, isActive: true });
    
    if (car) {
      // return it and set it to redis
      console.log('🎯 Found car in database, caching to Redis:', id);
      const bookingResult = bookingLogic(car, startDate, endDate, startTime, endTime);
      
      if (bookingResult.isDateUnavailable) {
        return res.status(409).json({
          success: false,
          message: "Date is unavailable",
          data: bookingResult
        });
      }
      
      await setJSON(`car:${id}`, car, 300);
      
      return res.status(200).json({
        success: true,
        message: "Car found in database",
        data: car,
        booking: bookingResult
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





