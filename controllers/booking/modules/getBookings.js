const Booking = require('../../../models/booking');
const { getJSON, setJSON } = require('../../../utils/redis');
const { formatDate } = require('../../../utils/logging');

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
      email,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Check if we have query filters that require DB query
    const hasFilters = status || userId || carId || startDate || email;

    // Try Redis cache first (only for unfiltered requests)
    if (!hasFilters) {
      const cachedBookings = await getJSON('bookings');
      if (cachedBookings) {
        console.log(`[${formatDate()}] - REDIS HIT bookings cache (${cachedBookings.length} bookings)`);

        // Strip availability from cached selectedCar data
        const cleanedBookings = cachedBookings.map(booking => {
          if (booking.selectedCar && booking.selectedCar.availability) {
            const { availability, ...carWithoutAvailability } = booking.selectedCar;
            return { ...booking, selectedCar: carWithoutAvailability };
          }
          return booking;
        });

        // Apply pagination on cached data
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const paginatedBookings = cleanedBookings.slice(skip, skip + parseInt(limit));

        return res.status(200).json({
          success: true,
          data: paginatedBookings,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: cachedBookings.length,
            pages: Math.ceil(cachedBookings.length / parseInt(limit))
          },
          cache: 'hit'
        });
      }
      console.log(`[${formatDate()}] - REDIS MISS bookings cache - querying database`);
    }

    // Build query
    const query = {};
    
    if (status) {
      query.paymentStatus = status;
    }
    
    if (userId) {
      query.userId = userId;
    }
    
    if (carId) {
      query.selectedCar = carId;
    }

    if (email) {
      query['bookingDetails.email'] = email;
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
      .populate('selectedCar', '-availability')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Booking.countDocuments(query);

    // If email filter was applied but no results found, return 404
    if (email && total === 0) {
      return res.status(404).json({
        success: false,
        message: 'No bookings found for this email address'
      });
    }

    // Cache all bookings to Redis (only for unfiltered requests)
    if (!hasFilters) {
      try {
        const allBookings = await Booking.find().populate('selectedCar', '-availability').sort({ createdAt: -1 });
        await setJSON('bookings', allBookings, 600);
        console.log(`[${formatDate()}] - REDIS SET bookings cache updated after miss (${allBookings.length} bookings)`);
      } catch (cacheError) {
        console.error(`[${formatDate()}] - REDIS SET bookings cache error:`, cacheError.message);
      }
    }
    
    res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      cache: 'miss'
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
