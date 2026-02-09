const Car = require('../../../models/car');
const { getJSON, setJSON } = require('../../../utils/redis');

// @desc    Create a new car
// @route   POST /api/cars
// @access  Private
exports.createCar = async (req, res) => {
  try {
    const carData = req.body;
    
    // Create new car
    const car = new Car(carData);
    await car.save();
    
    // Update cars cache with new car
    try {
      const cachedData = await getJSON('cars');
      if (cachedData && cachedData.data) {
        // Add new car to existing cached data
        cachedData.data.push(car);
        cachedData.pagination.total += 1;
        cachedData.pagination.pages = Math.ceil(cachedData.pagination.total / cachedData.pagination.limit);
        
        // Update cache
        await setJSON('cars', cachedData, 300);
      }
    } catch (error) {
      // If cache update fails, continue (cache will be refreshed on next request)
      console.log('Cache update failed, will refresh on next request');
    }
    
    // Emit real-time update to connected clients
    const { emitCarCreated } = require('../../../utils/socket');
    emitCarCreated(global.io, car);
    
    res.status(201).json({
      success: true,
      data: car,
      message: 'Car created successfully'
    });
  } catch (error) {
    console.error('Error creating car:', error);
    
    if (error.code === 11000) {
      // Duplicate key error (car ID already exists)
      return res.status(400).json({
        success: false,
        message: 'Car ID already exists'
      });
    }
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating car',
      error: error.message
    });
  }
};
