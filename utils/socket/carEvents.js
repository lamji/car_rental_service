/**
 * Car-related Socket.IO event emitters
 * Modularized for better scalability
 */

const { formatDate } = require('../logging');

/**
 * Emits car hold status update to connected clients
 * @param {Object} io - Socket.io instance
 * @param {Object} car - Updated car object
 * @param {string} action - Action performed (hold/unhold)
 * @param {string} reason - Reason for hold status change
 */
function emitCarHoldUpdate(io, car, action, reason) {
  try {
    const payload = {
      event: 'car_hold_status_updated',
      data: {
        car: {
          id: car._id,
          name: car.name,
          type: car.type,
          isOnHold: car.isOnHold,
          holdReason: car.holdReason,
          pricePerDay: car.pricePerDay,
          image: car.image,
          availability: car.availability
        },
        action,
        reason,
        timestamp: new Date().toISOString()
      }
    };

    // Emit to all connected clients
    io.emit('car_hold_status_updated', payload);
    
    // Emit to specific car room if exists
    io.to(`car:${car.id}`).emit('car_hold_status_updated', payload);
    
    // Emit to admin room
    io.to('admin').emit('car_hold_status_updated', payload);
    
    console.log(`\n[${formatDate()}] - 📡 CAR HOLD STATUS EMITTED | Car: ${car.id} | Action: ${action} | Reason: ${reason}`);
    
  } catch (error) {
    console.error(`[${formatDate()}] - 🔴 ERROR EMITTING CAR HOLD STATUS:`, error);
  }
}

/**
 * Emits car created event to connected clients
 * @param {Object} io - Socket.io instance
 * @param {Object} car - New car object
 */
function emitCarCreated(io, car) {
  try {
    const payload = {
      event: 'car_created',
      data: {
        car: {
          id: car.id,
          name: car.name,
          type: car.type,
          pricePerDay: car.pricePerDay,
          image: car.image,
          isActive: car.isActive,
          isOnHold: car.isOnHold
        },
        timestamp: new Date().toISOString()
      }
    };

    // Emit to all connected clients
    io.emit('car_created', payload);
    
    // Emit to admin room
    io.to('admin').emit('car_created', payload);
    
    console.log(`\n[${formatDate()}] - 📡 CAR CREATED EMITTED | Car: ${car.id}`);
    
  } catch (error) {
    console.error(`[${formatDate()}] - 🔴 ERROR EMITTING CAR CREATED:`, error);
  }
}

module.exports = {
  emitCarHoldUpdate,
  emitCarCreated
};
