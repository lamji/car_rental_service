const mongoose = require('mongoose');

// Schema for garage location
const garageLocationSchema = new mongoose.Schema({
  address: { type: String, required: true },
  city: { type: String, required: true },
  province: { type: String, required: true },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  }
});

// Schema for car owner
const carOwnerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactNumber: { type: String, required: true }
});

// Schema for car availability
const availabilitySchema = new mongoose.Schema({
  isAvailableToday: { type: Boolean, default: true },
  unavailableDates: [{
    startDate: { type: String, required: true }, // YYYY-MM-DD format
    endDate: { type: String, required: true }, // YYYY-MM-DD format
    startTime: { type: String, required: true }, // HH:MM format
    endTime: { type: String, required: true }, // HH:MM format
    createdAt: { type: Date, default: Date.now }
  }]
});

// Main car schema
const carSchema = new mongoose.Schema({
  id: { 
    type: String, 
    required: true,
    unique: true,
    index: true
  },
  name: { 
    type: String, 
    required: true,
    index: true
  },
  type: { 
    type: String, 
    required: true,
    enum: ['sedan', 'suv', 'van', 'pickup truck', 'sports car', 'coupe', 'hatchback'],
    index: true
  },
  image: { type: String, required: true },
  imageUrls: [{ type: String }],
  fuel: { 
    type: String, 
    required: true,
    enum: ['gasoline', 'diesel', 'electric', 'hybrid']
  },
  year: { 
    type: Number, 
    required: true,
    min: 1900,
    max: new Date().getFullYear() + 1
  },
  pricePerDay: { 
    type: Number, 
    required: true,
    min: 0
  },
  pricePer12Hours: { 
    type: Number, 
    required: true,
    min: 0
  },
  pricePer24Hours: { 
    type: Number, 
    required: true,
    min: 0
  },
  pricePerHour: { 
    type: Number, 
    required: true,
    min: 0
  },
  seats: { 
    type: Number, 
    required: true,
    min: 1,
    max: 20
  },
  transmission: { 
    type: String, 
    required: true,
    enum: ['manual', 'automatic']
  },
  deliveryFee: { 
    type: Number, 
    required: true,
    min: 0
  },
  garageAddress: { type: String, required: true },
  garageLocation: { 
    type: garageLocationSchema, 
    required: true 
  },
  owner: { 
    type: carOwnerSchema, 
    required: true 
  },
  rentedCount: { 
    type: Number, 
    default: 0,
    min: 0
  },
  rating: { 
    type: Number, 
    min: 0, 
    max: 5, 
    default: 0 
  },
  selfDrive: { 
    type: Boolean, 
    default: true 
  },
  driverCharge: { 
    type: Number, 
    default: 0,
    min: 0
  },
  availability: { 
    type: availabilitySchema, 
    default: () => ({}) 
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isOnHold: {
    type: Boolean,
    default: false,
    index: true
  },
  holdReason: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
carSchema.index({ type: 1, isActive: 1, isOnHold: 1 });
carSchema.index({ 'garageLocation.city': 1, isActive: 1, isOnHold: 1 });
carSchema.index({ 'garageLocation.province': 1, isActive: 1, isOnHold: 1 });
carSchema.index({ pricePerDay: 1, isActive: 1, isOnHold: 1 });
carSchema.index({ rating: -1, isActive: 1, isOnHold: 1 });
carSchema.index({ rentedCount: -1, isActive: 1, isOnHold: 1 });

// Pre-save middleware to update updatedAt
carSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to find cars by type
carSchema.statics.findByType = function(type, options = {}) {
  const { limit = 20, skip = 0, sortBy = 'createdAt', sortOrder = 'desc' } = options;
  
  const query = { type, isActive: true };
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  return this.find(query)
    .sort(sortOptions)
    .limit(limit)
    .skip(skip);
};

// Static method to find cars by location
carSchema.statics.findByLocation = function(city, province, options = {}) {
  const { limit = 20, skip = 0, sortBy = 'createdAt', sortOrder = 'desc' } = options;
  
  const query = { isActive: true };
  if (city) query['garageLocation.city'] = city;
  if (province) query['garageLocation.province'] = province;
  
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  return this.find(query)
    .sort(sortOptions)
    .limit(limit)
    .skip(skip);
};

// Static method to find available cars for dates
carSchema.statics.findAvailableForDates = function(startDate, endDate, options = {}) {
  const { limit = 20, skip = 0, type, city, province } = options;
  
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
  
  return this.find(query)
    .sort({ rating: -1, rentedCount: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to search cars
carSchema.statics.searchCars = function(searchTerm, options = {}) {
  const { limit = 20, skip = 0, type, minPrice, maxPrice } = options;
  
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
  if (minPrice !== undefined) query.pricePerDay = { $gte: minPrice };
  if (maxPrice !== undefined) {
    if (query.pricePerDay) {
      query.pricePerDay.$lte = maxPrice;
    } else {
      query.pricePerDay = { $lte: maxPrice };
    }
  }
  
  return this.find(query)
    .sort({ rating: -1, rentedCount: -1 })
    .limit(limit)
    .skip(skip);
};

// Instance method to check if car is available on specific dates
carSchema.methods.isAvailableOnDates = function(startDate, endDate) {
  const unavailableDates = this.availability.unavailableDates || [];
  
  // Check if any date in the range is in unavailableDates
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];
    if (unavailableDates.includes(dateStr)) {
      return false;
    }
  }
  
  return true;
};

// Instance method to add unavailable dates
carSchema.methods.addUnavailableDates = function(dates) {
  const unavailableDates = this.availability.unavailableDates || [];
  const newDates = Array.isArray(dates) ? dates : [dates];
  
  newDates.forEach(date => {
    if (!unavailableDates.includes(date)) {
      unavailableDates.push(date);
    }
  });
  
  this.availability.unavailableDates = unavailableDates.sort();
  return this.save();
};

// Instance method to remove unavailable dates
carSchema.methods.removeUnavailableDates = function(dates) {
  const unavailableDates = this.availability.unavailableDates || [];
  const datesToRemove = Array.isArray(dates) ? dates : [dates];
  
  this.availability.unavailableDates = unavailableDates.filter(
    date => !datesToRemove.includes(date)
  );
  
  return this.save();
};

// Instance method to increment rented count
carSchema.methods.incrementRentedCount = function() {
  this.rentedCount += 1;
  return this.save();
};

// Instance method to update rating
carSchema.methods.updateRating = function(newRating) {
  this.rating = Math.min(5, Math.max(0, newRating));
  return this.save();
};

module.exports = mongoose.model('Car', carSchema);
