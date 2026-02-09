const Car = require('../../../models/car');
const { getJSON, setJSON } = require('../../../utils/redis');
const { logInfo } = require('../../../utils/logging');

// @desc    Get car by ID
// @route   GET /api/cars/:id
// @access  Public
exports.getCarById = async (req, res) => {
  try {
    const carId = req.params.id;
    
    // Create cache key
    const cacheKey = `car:${carId}`;
    
    // Try to get from cache first
    const cachedResult = await getJSON(cacheKey);
    if (cachedResult) {
      logInfo(`🎯 Redis cache HIT for car endpoint`);
      return res.status(200).json(cachedResult);
    }
    
    logInfo(`🔍 Redis cache MISS - querying database`);
    
    const car = await Car.findOne({ id: carId, isActive: true });
    
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }
    
    const response = {
      success: true,
      data: car
    };
    
    // Cache the result for 10 minutes (600 seconds)
    await setJSON(cacheKey, response, 600);
    logInfo(`🎯 Redis cache SET for car endpoint`);
    
    res.status(200).json(response);
  } catch (error) {
    logError('Error getting car:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving car',
      error: error.message
    });
  }
};

// @desc    Get car by MongoDB ObjectId
// @route   GET /api/cars/mongo/:id
// @access  Private
exports.getCarByMongoId = async (req, res) => {
  try {
    const car = await Car.findOne({ _id: req.params.id, isActive: true });
    
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: car
    });
  } catch (error) {
    console.error('Error getting car by MongoDB ID:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid car ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error retrieving car',
      error: error.message
    });
  }
};
