/**
 * Car update-related Socket.IO event emitters
 * Modularized for better scalability
 */

const { formatDate } = require('../logging');

/**
 * Emits car updated event to connected clients
 * @param {Object} io - Socket.io instance
 * @param {Object} car - Updated car object
 */
function emitCarUpdated(io, car) {
  try {
    const payload = {
      event: 'car_updated',
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
        action: 'updated',
        timestamp: new Date().toISOString()
      }
    };

    // Emit to all connected clients
    io.emit('car_updated', payload);
    
    // Emit to admin room
    io.to('admin').emit('car_updated', payload);
    
    console.log(`\n[${formatDate()}] - 📡 CAR UPDATED EMITTED | Car: ${car.id}`);
    
  } catch (error) {
    console.error(`[${formatDate()}] - 🔴 ERROR EMITTING CAR UPDATED:`, error);
  }
}

module.exports = {
  emitCarUpdated
};
