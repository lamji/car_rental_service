const Car = require('../../../models/car');
const { getJSON, setJSON } = require('../../../utils/redis');
const { logInfo } = require('../../../utils/logging');

// @desc    Get cars by type
// @route   GET /api/cars/type/:type
// @access  Public
exports.getCarsByType = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Create cache key
    const cacheKey = `cars:type:${req.params.type}:${JSON.stringify({
      page,
      limit,
      sortBy,
      sortOrder
    })}`;
    
    // Try to get from cache first
    const cachedResult = await getJSON(cacheKey);
    if (cachedResult) {
      logInfo(`🎯 Redis cache HIT for cars-by-type endpoint`);
      return res.status(200).json(cachedResult);
    }
    
    logInfo(`🔍 Redis cache MISS - querying database`);
    
    const cars = await Car.findByType(req.params.type, {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      sortBy,
      sortOrder
    });
    
    const total = await Car.countDocuments({ 
      type: req.params.type, 
      isActive: true
    });
    
    const response = {
      success: true,
      data: cars,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    };
    
    // Cache the result for 5 minutes (300 seconds)
    await setJSON(cacheKey, response, 300);
    logInfo(`🎯 Redis cache SET for cars-by-type endpoint`);
    
    res.status(200).json(response);
  } catch (error) {
    logError('Error getting cars by type:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving cars by type',
      error: error.message
    });
  }
};

// @desc    Get cars by location
// @route   GET /api/cars/location
// @access  Public
exports.getCarsByLocation = async (req, res) => {
  try {
    const {
      city,
      province,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const cars = await Car.findByLocation(city, province, {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      sortBy,
      sortOrder
    });
    
    const query = { isActive: true };
    if (city) query['garageLocation.city'] = city;
    if (province) query['garageLocation.province'] = province;
    
    const total = await Car.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: cars,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting cars by location:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving cars by location',
      error: error.message
    });
  }
};

// @desc    Get available cars for specific dates
// @route   GET /api/cars/available
// @access  Public
exports.getAvailableCars = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      type,
      city,
      province,
      page = 1,
      limit = 20
    } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }
    
    const cars = await Car.findAvailableForDates(startDate, endDate, {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      type,
      city,
      province
    });
    
    // Count total available cars
    const query = { 
      isActive: true,
      'availability.unavailableDates': { 
        $not: { 
          $elemMatch: { 
            $gte: startDate, 
            $lte: endDate 
          } 
        } 
      }
    };
    
    if (type) query.type = type;
    if (city) query['garageLocation.city'] = city;
    if (province) query['garageLocation.province'] = province;
    
    const total = await Car.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: cars,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      dateRange: {
        startDate,
        endDate
      }
    });
  } catch (error) {
    console.error('Error getting available cars:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving available cars',
      error: error.message
    });
  }
};

// @desc    Search cars
// @route   GET /api/cars/search
// @access  Public
exports.searchCars = async (req, res) => {
  try {
    const {
      q: searchTerm,
      type,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20
    } = req.query;
    
    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: 'Search term is required'
      });
    }
    
    const cars = await Car.searchCars(searchTerm, {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      type,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined
    });
    
    // Build count query
    const query = { 
      isActive: true,
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { type: { $regex: searchTerm, $options: 'i' } },
        { 'garageLocation.city': { $regex: searchTerm, $options: 'i' } },
        { 'garageLocation.province': { $regex: searchTerm, $options: 'i' } }
      ]
    };
    
    if (type) query.type = type;
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.pricePerDay = {};
      if (minPrice !== undefined) query.pricePerDay.$gte = parseFloat(minPrice);
      if (maxPrice !== undefined) query.pricePerDay.$lte = parseFloat(maxPrice);
    }
    
    const total = await Car.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: cars,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      search: {
        term: searchTerm,
        filters: { type, minPrice, maxPrice }
      }
    });
  } catch (error) {
    console.error('Error searching cars:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching cars',
      error: error.message
    });
  }
};
