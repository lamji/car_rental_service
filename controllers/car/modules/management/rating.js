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

// Helper function to validate rating
const validateRating = (rating) => {
  if (typeof rating !== 'number' || rating < 0 || rating > 5) {
    throw new Error('Rating must be a number between 0 and 5');
  }
};

// Helper function to handle errors
const handleError = (error, res, customMessage) => {
  if (error.message.includes('Rating must be')) {
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

// @desc    Update car rating
// @route   PATCH /api/cars/:id/rating
// @access  Private
exports.updateRating = async (req, res) => {
  try {
    const { rating } = req.body;
    const carId = req.params.id;
    
    // Validate rating
    validateRating(rating);
    
    // Find car
    const car = await findCarById(carId);
    
    // Update rating
    await car.updateRating(rating);
    
    // Emit real-time update to connected clients
    const { emitCarUpdated } = require('../../../../utils/socket');
    emitCarUpdated(global.io, car);
    
    // Respond
    res.status(200).json({
      success: true,
      data: car,
      message: 'Car rating updated successfully'
    });
    
  } catch (error) {
    handleError(error, res, 'Error updating car rating');
  }
};
