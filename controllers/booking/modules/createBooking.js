const Booking = require('../../../models/booking');

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res) => {
  const session = await Booking.startSession();
  
  try {
    const bookingData = req.body;
    const { bookingDetails, selectedCar } = bookingData;
    
    // Start transaction for race condition protection
    const booking = await session.withTransaction(async () => {
      // Check for race condition - conflicting bookings for the same car
      const conflictingBooking = await Booking.findOne({
        'selectedCar.id': selectedCar.id,
        'bookingStatus': { $in: ['pending', 'confirmed', 'active'] },
        $expr: {
          $or: [
            // Date overlap check (for multi-day bookings)
            {
              $and: [
                { $lte: ['$bookingDetails.startDate', bookingDetails.endDate] },
                { $gte: ['$bookingDetails.endDate', bookingDetails.startDate] }
              ]
            },
            // Same date with time overlap check
            {
              $and: [
                { $eq: ['$bookingDetails.startDate', bookingDetails.startDate] },
                { $eq: ['$bookingDetails.endDate', bookingDetails.endDate] },
                {
                  $or: [
                    // New booking starts during existing booking time
                    {
                      $and: [
                        { $lte: ['$bookingDetails.startTime', bookingDetails.startTime] },
                        { $gt: ['$bookingDetails.endTime', bookingDetails.startTime] }
                      ]
                    },
                    // New booking ends during existing booking time
                    {
                      $and: [
                        { $lt: ['$bookingDetails.startTime', bookingDetails.endTime] },
                        { $gte: ['$bookingDetails.endTime', bookingDetails.endTime] }
                      ]
                    },
                    // New booking completely overlaps existing booking time
                    {
                      $and: [
                        { $gte: ['$bookingDetails.startTime', bookingDetails.startTime] },
                        { $lte: ['$bookingDetails.endTime', bookingDetails.endTime] }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      }).session(session);
      
      if (conflictingBooking) {
        // Throw error to abort transaction
        const error = new Error('Car is already booked for the selected dates and times');
        error.code = 'BOOKING_CONFLICT';
        error.conflict = {
          bookingId: conflictingBooking.bookingId,
          startDate: conflictingBooking.bookingDetails.startDate,
          endDate: conflictingBooking.bookingDetails.endDate,
          startTime: conflictingBooking.bookingDetails.startTime,
          endTime: conflictingBooking.bookingDetails.endTime,
          bookingStatus: conflictingBooking.bookingStatus
        };
        throw error;
      }
      
      // Create new booking within transaction
      const newBooking = new Booking(bookingData);
      await newBooking.save({ session });
      
      return newBooking;
    });
    
    res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking created successfully'
    });
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error creating booking:', error);
    
    if (error.code === 'BOOKING_CONFLICT') {
      return res.status(409).json({
        success: false,
        message: error.message,
        conflict: error.conflict
      });
    }
    
    if (error.code === 11000) {
      // Duplicate key error (bookingId already exists)
      return res.status(400).json({
        success: false,
        message: 'Booking ID already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};
