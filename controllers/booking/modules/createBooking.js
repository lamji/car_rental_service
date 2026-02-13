const mongoose = require('mongoose');
const Booking = require('../../../models/booking');
const Car = require('../../../models/car');
const { validationResult } = require('express-validator');
const { clearHoldCountdown } = require('../../../utils/holdCountdown');
const { setJSON, clearCache } = require('../../../utils/redis');
const { formatDate } = require('../../../utils/logging');

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res) => {
  const session = await Booking.startSession();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const bookingData = req.body;
    const { bookingDetails, selectedCar, userId } = bookingData;

    // Normalize selectedCar: extract _id if full object was sent
    const selectedCarId = (typeof selectedCar === 'object' && selectedCar?._id) ? selectedCar._id : selectedCar;

    // Validate car exists
    const carId = new mongoose.Types.ObjectId(selectedCarId);
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }
    
    // Start transaction for race condition protection
    let savedBooking = null;
    console.log(`debug:createBooking - userId from request: "${userId}", carId: "${carId}"`);
    
    // Verify the user has an active hold for these dates on this car.
    // The hold system adds entries to Car.availability.unavailableDates with a userAgent.
    // If the user has a hold, they should be allowed to save their booking.
    const userAgent = req.headers['user-agent'] || '';
    const { getActiveHold } = require('../../../utils/holdCountdown');
    const activeHold = getActiveHold(userAgent);
    const hasActiveHold = activeHold && activeHold.carId === carId.toString();
    console.log(`debug:createBooking - userAgent hold check: hasActiveHold=${hasActiveHold}, activeHold:`, activeHold);
    
    await session.withTransaction(async () => {
      // Check for conflicting bookings for the same car
      const dateOverlapQuery = {
        selectedCar: carId,
        'bookingStatus': { $in: ['pending', 'confirmed', 'active'] },
        $or: [
          // Date overlap check (for multi-day bookings)
          {
            'bookingDetails.startDate': { $lte: bookingDetails.endDate },
            'bookingDetails.endDate': { $gte: bookingDetails.startDate }
          }
        ]
      };
      
      const conflictingBookings = await Booking.find(dateOverlapQuery).session(session);
      
      if (conflictingBookings.length > 0) {
        // If the user has an active hold, cancel stale pending bookings that conflict
        // (these are leftover from previous sessions that were never paid)
        if (hasActiveHold) {
          const stalePending = conflictingBookings.filter(b => 
            b.bookingStatus === 'pending' && b.paymentStatus === 'pending'
          );
          const nonStale = conflictingBookings.filter(b => 
            !(b.bookingStatus === 'pending' && b.paymentStatus === 'pending')
          );
          
          // Cancel stale pending bookings
          if (stalePending.length > 0) {
            const staleIds = stalePending.map(b => b._id);
            console.log(`debug:createBooking - cancelling ${stalePending.length} stale pending booking(s):`, staleIds);
            await Booking.updateMany(
              { _id: { $in: staleIds } },
              { $set: { bookingStatus: 'cancelled', updatedAt: new Date() } },
              { session }
            );
          }
          
          // If there are still non-stale conflicts (confirmed/active/paid), block
          if (nonStale.length > 0) {
            const conflict = nonStale[0];
            const error = new Error('Car is already booked for the selected dates and times');
            error.code = 'BOOKING_CONFLICT';
            error.conflict = {
              bookingId: conflict.bookingId,
              startDate: conflict.bookingDetails.startDate,
              endDate: conflict.bookingDetails.endDate,
              startTime: conflict.bookingDetails.startTime,
              endTime: conflict.bookingDetails.endTime,
              bookingStatus: conflict.bookingStatus
            };
            throw error;
          }
        } else {
          // No active hold — block with conflict error
          const conflict = conflictingBookings[0];
          const error = new Error('Car is already booked for the selected dates and times');
          error.code = 'BOOKING_CONFLICT';
          error.conflict = {
            bookingId: conflict.bookingId,
            startDate: conflict.bookingDetails.startDate,
            endDate: conflict.bookingDetails.endDate,
            startTime: conflict.bookingDetails.startTime,
            endTime: conflict.bookingDetails.endTime,
            bookingStatus: conflict.bookingStatus
          };
          throw error;
        }
      }
      
      // Create new booking within transaction
      const newBooking = new Booking({
        ...bookingData,
        selectedCar: carId
      });
      await newBooking.save({ session });
      
      savedBooking = newBooking;
    });
    
    // Booking saved successfully — clear the hold countdown so it becomes permanent
    const holdCleared = clearHoldCountdown(userAgent);
    console.log(`debug:createBooking - hold cleared: ${holdCleared}`);

    // Update Redis bookings cache
    try {
      await clearCache('bookings');
      const allBookings = await Booking.find().populate('selectedCar').sort({ createdAt: -1 });
      await setJSON('bookings', allBookings, 600);
      console.log(`[${formatDate()}] - REDIS SET bookings cache updated (${allBookings.length} bookings)`);
    } catch (cacheError) {
      console.error(`[${formatDate()}] - REDIS SET bookings cache error:`, cacheError.message);
    }

    // Populate selectedCar in the response
    const populatedBooking = await Booking.findById(savedBooking._id).populate('selectedCar');

    res.status(201).json({
      success: true,
      data: populatedBooking,
      message: 'Booking created successfully'
    });
    
  } catch (error) {
    // Note: session.withTransaction() already handles abort internally,
    // so we only need to abort if the transaction is still active
    if (session.inTransaction()) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.error('Error aborting transaction:', abortError.message);
      }
    }
    
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
