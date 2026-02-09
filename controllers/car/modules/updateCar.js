const Car = require('../../../models/car');

// @desc    Update car
// @route   PUT /api/cars/:id
// @access  Private
exports.updateCar = async (req, res) => {
  try {
    const car = await Car.findOneAndUpdate(
      { id: req.params.id, isActive: true },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }
    
    // Emit real-time update to connected clients
    const { emitCarUpdated } = require('../../../utils/socket');
    emitCarUpdated(global.io, car);
    
    res.status(200).json({
      success: true,
      data: car,
      message: 'Car updated successfully'
    });
  } catch (error) {
    console.error('Error updating car:', error);
    
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
      message: 'Error updating car',
      error: error.message
    });
  }
};

// @desc    Delete car (soft delete)
// @route   DELETE /api/cars/:id
// @access  Private
exports.deleteCar = async (req, res) => {
  try {
    const car = await Car.findOneAndUpdate(
      { id: req.params.id, isActive: true },
      { isActive: false },
      { new: true }
    );
    
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }
    
    // Emit real-time update to connected clients
    const { emitCarDeleted } = require('../../../utils/socket');
    emitCarDeleted(global.io, car);
    
    res.status(200).json({
      success: true,
      message: 'Car deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting car:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting car',
      error: error.message
    });
  }
};

// @desc    Hard delete car (permanent)
// @route   DELETE /api/cars/:id/hard
// @access  Private
exports.hardDeleteCar = async (req, res) => {
  try {
    const car = await Car.findOneAndDelete({ id: req.params.id });
    
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Car permanently deleted'
    });
  } catch (error) {
    console.error('Error hard deleting car:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting car',
      error: error.message
    });
  }
};
