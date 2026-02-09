const Booking = require('../../../models/booking');

// @desc    Get all bookings (with pagination and filtering)
// @route   GET /api/bookings
// @access  Private
exports.getBookings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      userId,
      carId,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build query
    const query = {};
    
    if (status) {
      query.paymentStatus = status;
    }
    
    if (userId) {
      query.userId = userId;
    }
    
    if (carId) {
      query['selectedCar.id'] = carId;
    }
    
    if (startDate && endDate) {
      query.$and = [
        { 'bookingDetails.startDate': { $lte: endDate } },
        { 'bookingDetails.endDate': { $gte: startDate } }
      ];
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const bookings = await Booking.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Booking.countDocuments(query);
    
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
    console.error('Error getting bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving bookings',
      error: error.message
    });
  }
};
