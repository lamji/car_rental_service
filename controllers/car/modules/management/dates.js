const Car = require('../../../../models/car');

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

// Helper function to handle errors
const handleError = (error, res, customMessage) => {
  if (error.message.includes('required') || error.message.includes('format')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  console.error(customMessage, error);
  res.status(500).json({
    success: false,
    message: customMessage,
    error: error.message
  });
};

// @desc    Add unavailable dates to car
// @route   POST /api/cars/:id/unavailable-dates
// @access  Private
exports.addUnavailableDates = async (req, res) => {
  try {
    const { dates } = req.body;
    const carId = req.params.id;
    
    // Validate dates
    validateDatesArray(dates, 'Dates');
    
    // Find car
    const car = await findCarById(carId);
    
    // Add unavailable dates
    await car.addUnavailableDates(dates);
    
    // Respond
    res.status(200).json({
      success: true,
      data: car,
      message: 'Unavailable dates added successfully'
    });
    
  } catch (error) {
    handleError(error, res, 'Error adding unavailable dates');
  }
};

// @desc    Remove unavailable dates from car
// @route   DELETE /api/cars/:id/unavailable-dates
// @access  Private
exports.removeUnavailableDates = async (req, res) => {
  try {
    const { dates } = req.body;
    const carId = req.params.id;
    
    // Validate dates
    validateDatesArray(dates, 'Dates');
    
    // Find car
    const car = await findCarById(carId);
    
    // Remove unavailable dates
    await car.removeUnavailableDates(dates);
    
    // Respond
    res.status(200).json({
      success: true,
      data: car,
      message: 'Unavailable dates removed successfully'
    });
    
  } catch (error) {
    handleError(error, res, 'Error removing unavailable dates');
  }
};
