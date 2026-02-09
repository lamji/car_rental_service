const Car = require('../../../models/car');
const { getJSON, setJSON } = require('../../../utils/redis');
const { logInfo } = require('../../../utils/logging');

// @desc    Get all cars with pagination and filtering
// @route   GET /api/cars
// @access  Public
exports.getCars = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      city,
      province,
      minPrice,
      maxPrice,
      fuel,
      transmission,
      seats,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      availableFrom,
      availableTo
    } = req.query;
    
    // Normalize numeric values for consistent cache keys
    const normalizedPage = parseInt(page) || 1;
    const normalizedLimit = parseInt(limit) || 20;
    
    // Create simple cache key
    const cacheKey = 'cars';
    
    // Try to get from cache first
    const cachedResult = await getJSON(cacheKey);
    if (cachedResult) {
      logInfo(`🎯 Redis cache HIT for cars endpoint`);
      return res.status(200).json(cachedResult);
    }
    
    logInfo(`🔍 Redis cache MISS - querying database`);
    
    // Build query
    const query = { isActive: true };
    
    if (type) query.type = type;
    if (city) query['garageLocation.city'] = city;
    if (province) query['garageLocation.province'] = province;
    if (fuel) query.fuel = fuel;
    if (transmission) query.transmission = transmission;
    if (seats) query.seats = parseInt(seats);
    
    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.pricePerDay = {};
      if (minPrice !== undefined) query.pricePerDay.$gte = parseFloat(minPrice);
      if (maxPrice !== undefined) query.pricePerDay.$lte = parseFloat(maxPrice);
    }
    
    // Availability filter
    if (availableFrom && availableTo) {
      query['availability.unavailableDates'] = { 
        $not: { 
          $elemMatch: { 
            $gte: availableFrom, 
            $lte: availableTo 
          } 
        } 
      };
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
        { 'garageLocation.city': { $regex: search, $options: 'i' } },
        { 'garageLocation.province': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const skip = (normalizedPage - 1) * normalizedLimit;
    
    // Sorting
    const sortOptions = {};
    const validSortFields = ['createdAt', 'name', 'pricePerDay', 'rating', 'rentedCount', 'year'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    sortOptions[sortField] = sortOrder === 'desc' ? -1 : 1;
    
    const cars = await Car.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(normalizedLimit);
    
    const total = await Car.countDocuments(query);
    
    const response = {
      success: true,
      data: cars,
      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        pages: Math.ceil(total / normalizedLimit)
      },
      filters: {
        type,
        city,
        province,
        minPrice,
        maxPrice,
        fuel,
        transmission,
        seats,
        search,
        availableFrom,
        availableTo
      }
    };
    
    // Cache the result for 5 minutes (300 seconds)
    await setJSON(cacheKey, response, 300);
    logInfo(`🎯 Redis cache SET for cars endpoint`);

    res.status(200).json(response);
  } catch (error) {
    logError('Error getting cars:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving cars',
      error: error.message
    });
  }
};
