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

// Helper function to handle errors
const handleError = (error, res, customMessage) => {
  console.error(customMessage, error);
  res.status(500).json({
    success: false,
    message: customMessage,
    error: error.message
  });
};

// @desc    Increment car rented count
// @route   PATCH /api/cars/:id/increment-rented
// @access  Private
exports.incrementRentedCount = async (req, res) => {
  try {
    const carId = req.params.id;
    
    // Find car
    const car = await findCarById(carId);
    
    // Increment rented count
    await car.incrementRentedCount();
    
    // Emit real-time update to connected clients
    const { emitCarUpdated } = require('../../../../utils/socket');
    emitCarUpdated(global.io, car);
    
    // Respond
    res.status(200).json({
      success: true,
      data: car,
      message: 'Rented count incremented successfully'
    });
    
  } catch (error) {
    handleError(error, res, 'Error incrementing rented count');
  }
};
