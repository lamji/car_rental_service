const Car = require('../../../../models/car');
const { logInfo, logError } = require('../../../../utils/logging');
const { emitCarHoldUpdate } = require('../../../../utils/socket');

// Helper function to find car by ID (supports both string ID and MongoDB ObjectId)
const findCarById = async (carId) => {
  let car;
  
  // First try to find by string ID (e.g., "vios-2021")
  car = await Car.findOne({ id: carId, isActive: true });
  
  // If not found, try MongoDB ObjectId
  if (!car && carId.match(/^[0-9a-fA-F]{24}$/)) {
    car = await Car.findOne({ _id: carId, isActive: true });
  }
  
  if (!car) {
    throw new Error('Car not found');
  }
  
  return car;
};

// Helper function to update car availability fields
const updateAvailabilityFields = (car, { unavailableDates, isAvailableToday }) => {
  if (unavailableDates) {
    car.availability.unavailableDates = unavailableDates;
  }
  
  if (isAvailableToday !== undefined) {
    car.availability.isAvailableToday = isAvailableToday;
  }
  
  return car;
};

// Helper function to save car and return response
const saveCarAndRespond = async (car, res, message) => {
  try {
    await car.save();
    
    res.status(200).json({
      success: true,
      data: car,
      message
    });
  } catch (error) {
    throw error;
  }
};

// Helper function to clear cache for specific car
const clearCarCache = async (carId) => {
  const { clearCache } = require('../../../../utils/redis');
  
  // Clear all cache keys that might contain this car
  const patterns = [
    'cars', // Main cars list cache
    `car:${carId}`,
    `cars:*${carId}*`,
    `cars:type:*${carId}*`,
    `cars:*${carId}*`
  ];
  
  for (const pattern of patterns) {
    try {
      await clearCache(pattern);
    } catch (error) {
      logError(`Failed to clear cache pattern ${pattern}: ${error.message}`);
    }
  }
  
  logInfo(`🗑️ Cache cleared for car ${carId}`);
};

// Helper function to clear all cars cache
const clearAllCarsCache = async () => {
  const { clearCache, getConnectionStatus } = require('../../../../utils/redis');
  
  try {
    if (!getConnectionStatus()) {
      logInfo('🗄️ Redis not connected - skipping cache clear');
      return;
    }
    
    // Import Redis client directly for SCAN operation
    const redis = require('../../../../utils/redis');
    
    // Get the Redis client instance
    const { getClient } = require('../../../../utils/redis');
    const client = getClient();
    
    if (client) {
      // Use SCAN to find all keys starting with 'cars:'
      let cursor = '0';
      const keysToDelete = [];
      
      do {
        try {
          const reply = await client.scan(cursor, {
            MATCH: 'cars:*',
            COUNT: 100
          });
          
          cursor = reply.cursor;
          keysToDelete.push(...reply.keys);
        } catch (scanError) {
          logError(`Redis SCAN error: ${scanError.message}`);
          break;
        }
      } while (cursor !== '0');
      
      // Delete all found keys
      if (keysToDelete.length > 0) {
        await client.del(keysToDelete);
        logInfo(`🗑️ Deleted ${keysToDelete.length} cars cache keys:`, keysToDelete);
      } else {
        logInfo('🔍 No cars cache keys found to delete');
      }
    }
    
    // Fallback to manual clearing if SCAN doesn't work
    const commonQueries = [
      { page: 1, limit: 20 }, // Default query
      { page: 1 }, // Page 1 only
      {}, // Empty query
    ];
    
    for (const query of commonQueries) {
      const cacheKey = `cars:${JSON.stringify(query)}`;
      await clearCache(cacheKey);
      logInfo(`🗑️ Cleared cache key: ${cacheKey}`);
    }
    
    logInfo('🗑️ All cars cache cleared successfully');
  } catch (error) {
    logError(`Failed to clear all cars cache: ${error.message}`);
  }
};

// Helper function to handle errors
const handleError = (error, res, customMessage) => {
  logError(`${customMessage}: ${error.message}`);
  
  res.status(500).json({
    success: false,
    message: customMessage,
    error: error.message
  });
};

// Helper function to validate dates array
const validateDatesArray = (dates, fieldName) => {
  if (!dates || !Array.isArray(dates)) {
    throw new Error(`${fieldName} array is required`);
  }
  
  for (const date of dates) {
    if (!typeof date === 'string' || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      throw new Error('All dates must be in YYYY-MM-DD format');
    }
  }
};

// Helper function to validate rating
const validateRating = (rating) => {
  if (typeof rating !== 'number' || rating < 0 || rating > 5) {
    throw new Error('Rating must be a number between 0 and 5');
  }
};

// @desc    Update car availability
// @route   PATCH /api/cars/:id/availability
// @access  Private
exports.updateAvailability = async (req, res) => {
  try {
    const { unavailableDates, isAvailableToday } = req.body;
    const carId = req.params.id;
    
    // Find car
    const car = await findCarById(carId);
    
    // Update availability fields
    updateAvailabilityFields(car, { unavailableDates, isAvailableToday });
    
    // Save the car
    await car.save();
    
    // Clear cache for this car and all cars lists
    await clearCarCache(carId);
    await clearAllCarsCache();

    // Emit real-time update to connected clients
    const { emitCarAvailabilityUpdate } = require('../../../../utils/socket');
    emitCarAvailabilityUpdate(global.io, car);
    
    // Respond
    res.status(200).json({
      success: true,
      data: car,
      message: 'Car availability updated successfully'
    });
    
  } catch (error) {
    handleError(error, res, 'Error updating car availability');
  }
};

// @desc    Update car hold status
// @route   PATCH /api/cars/:id/hold-status
// @access  Private
exports.updateHoldStatus = async (req, res) => {
  try {
    const { isOnHold, reason } = req.body;
    const carId = req.params.id;
    
    // Validate input
    if (typeof isOnHold !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isOnHold must be a boolean value'
      });
    }
    
    // Find car
    const car = await findCarById(carId);
    
    // Update hold status
    car.isOnHold = isOnHold;
    
    // Store reason for hold status
    if (reason) {
      car.holdReason = reason;
    }
    
    // Save the car
    await car.save();
    
    // Clear cache for this car and all cars lists
    await clearCarCache(carId);
    await clearAllCarsCache();

    // Emit real-time update to connected clients
    const action = isOnHold ? 'hold' : 'unhold';
    emitCarHoldUpdate(global.io, car, action, reason || 'No reason provided');
    // Respond
    res.status(200).json({
      success: true,
      data: car,
      message: `Car ${isOnHold ? 'placed on' : 'released from'} hold successfully`
    });
    
  } catch (error) {
    handleError(error, res, 'Error updating car hold status');
  }
};
