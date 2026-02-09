/**
 * Car availability-related Socket.IO event emitters
 * Modularized for better scalability
 */

const { formatDate } = require('../logging');

/**
 * Emits car availability update to connected clients
 * @param {Object} io - Socket.io instance
 * @param {Object} car - Updated car object
 */
function emitCarAvailabilityUpdate(io, car) {
  try {
    const payload = {
      event: 'car_availability_updated',
      data: {
        car: {
          id: car.id,
          name: car.name,
          type: car.type,
          availability: car.availability,
          isAvailableToday: car.isAvailableToday,
          pricePerDay: car.pricePerDay,
          image: car.image
        },
        timestamp: new Date().toISOString()
      }
    };

    // Emit to all connected clients
    io.emit('car_availability_updated', payload);
    
    // Emit to specific car room if exists
    io.to(`car:${car.id}`).emit('car_availability_updated', payload);
    
    console.log(`\n[${formatDate()}] - 📡 CAR AVAILABILITY EMITTED | Car: ${car.id}`);
    
  } catch (error) {
    console.error(`[${formatDate()}] - 🔴 ERROR EMITTING CAR AVAILABILITY:`, error);
  }
}

module.exports = {
  emitCarAvailabilityUpdate
};
