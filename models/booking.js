const mongoose = require('mongoose');

// Schema for booking details
const bookingDetailsSchema = new mongoose.Schema({
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  pickupType: { 
    type: String, 
    enum: ['delivery', 'pickup'], 
    required: true 
  },
  rentalPrice: { type: Number, required: true },
  deliveryFee: { type: Number, required: true },
  driverFee: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true },
  pricingType: { 
    type: String, 
    enum: ['hourly', '12-hours', '24-hours', 'daily'], 
    required: true 
  },
  durationHours: { type: Number, required: true },
  excessHours: { type: Number, default: 0 },
  excessHoursPrice: { type: Number, default: 0 },
  dataConsent: { type: Boolean, required: true },
  licenseImage: { type: String, required: true },
  ltoPortalScreenshot: { type: String, required: true },
  firstName: { type: String, required: true },
  middleName: { type: String },
  lastName: { type: String, required: true },
  contactNumber: { type: String, required: true },
  email: { type: String, required: true },
  idType: { 
    type: String, 
    enum: ['drivers_license', 'passport', 'national_id', 'postal_id', 'sss_id', 'gsis_id', 'philhealth_id', 'pagibig_id', 'prc_license', 'senior_citizen_id', 'voters_id', 'student_id', 'others'], 
    required: true 
  },
  licenseNumber: { type: String, required: true }
});


// Main booking schema
const bookingSchema = new mongoose.Schema({
  bookingDetails: {
    type: bookingDetailsSchema,
    required: true
  },
  selectedCar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: true,
    index: true
  },
  userId: { 
    type: String, 
    required: true,
    index: true
  },
  bookingId: { 
    type: String, 
    required: true,
    unique: true,
    index: true
  },
  paymentMethod: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'refunded', 'cancelled'], 
    default: 'pending',
    index: true
  },
  bookingStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled'],
    default: 'pending',
    index: true
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
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ paymentStatus: 1, bookingStatus: 1 });
bookingSchema.index({ 'bookingDetails.startDate': 1, 'bookingDetails.endDate': 1 });
bookingSchema.index({ selectedCar: 1 });

// Pre-save middleware to update updatedAt
bookingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to find bookings by user
bookingSchema.statics.findByUserId = function(userId, options = {}) {
  const { limit = 20, skip = 0, status } = options;
  
  const query = { userId };
  if (status) query.paymentStatus = status;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to find bookings by car
bookingSchema.statics.findByCarId = function(carId, options = {}) {
  const { startDate, endDate } = options;
  
  const query = { selectedCar: carId };
  
  if (startDate && endDate) {
    query.$or = [
      {
        'bookingDetails.startDate': { $lte: endDate },
        'bookingDetails.endDate': { $gte: startDate }
      }
    ];
  }
  
  return this.find(query).populate('selectedCar').sort({ createdAt: -1 });
};

// Instance method to check if booking is active
bookingSchema.methods.isActive = function() {
  const now = new Date();
  const startDateTime = new Date(`${this.bookingDetails.startDate}T${this.bookingDetails.startTime}`);
  const endDateTime = new Date(`${this.bookingDetails.endDate}T${this.bookingDetails.endTime}`);
  
  return now >= startDateTime && now <= endDateTime;
};

// Instance method to get booking duration in hours
bookingSchema.methods.getDuration = function() {
  const startDateTime = new Date(`${this.bookingDetails.startDate}T${this.bookingDetails.startTime}`);
  const endDateTime = new Date(`${this.bookingDetails.endDate}T${this.bookingDetails.endTime}`);
  
  const durationMs = endDateTime.getTime() - startDateTime.getTime();
  return durationMs / (1000 * 60 * 60);
};

module.exports = mongoose.model('Booking', bookingSchema);