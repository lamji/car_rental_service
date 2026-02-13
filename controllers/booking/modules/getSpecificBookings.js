const Booking = require('../../../models/booking');

// @desc    Get user bookings
// @route   GET /api/bookings/user/:userId
// @access  Private
exports.getUserBookings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status
    } = req.query;
    
    const bookings = await Booking.findByUserId(req.params.userId, {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      status
    }).populate('selectedCar');
    
    const total = await Booking.countDocuments({ 
      userId: req.params.userId,
      ...(status && { paymentStatus: status })
    });
    
    res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting user bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user bookings',
      error: error.message
    });
  }
};

// @desc    Get car bookings
// @route   GET /api/bookings/car/:carId
// @access  Private
exports.getCarBookings = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const bookings = await Booking.findByCarId(req.params.carId, {
      startDate,
      endDate
    });
    
    res.status(200).json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Error getting car bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving car bookings',
      error: error.message
    });
  }
};
