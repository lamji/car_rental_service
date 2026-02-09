/**
 * Car deletion-related Socket.IO event emitters
 * Modularized for better scalability
 */

const { formatDate } = require('../logging');

/**
 * Emits car deleted event to connected clients
 * @param {Object} io - Socket.io instance
 * @param {Object} car - Deleted car object
 */
function emitCarDeleted(io, car) {
  try {
    const payload = {
      event: 'car_deleted',
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
        action: 'deleted',
        timestamp: new Date().toISOString()
      }
    };

    // Emit to all connected clients
    io.emit('car_deleted', payload);
    
    // Emit to admin room
    io.to('admin').emit('car_deleted', payload);
    
    console.log(`\n[${formatDate()}] - 📡 CAR DELETED EMITTED | Car: ${car.id}`);
    
  } catch (error) {
    console.error(`[${formatDate()}] - 🔴 ERROR EMITTING CAR DELETED:`, error);
  }
}

module.exports = {
  emitCarDeleted
};
