// Car controller modules index file
// This file provides easy access to all car controller functions

module.exports = {
  // Create operations
  createCar: require('./createCar').createCar,
  
  // Read operations
  getCars: require('./getCars').getCars,
  getCarById: require('./getCarById').getCarById,
  getCarByMongoId: require('./getCarById').getCarByMongoId,
  getCarsByType: require('./getSpecificCars').getCarsByType,
  getCarsByLocation: require('./getSpecificCars').getCarsByLocation,
  getAvailableCars: require('./getSpecificCars').getAvailableCars,
  searchCars: require('./getSpecificCars').searchCars,
  
  // Update operations
  updateCar: require('./updateCar').updateCar,
  updateAvailability: require('./carManagement').updateAvailability,
  updateHoldStatus: require('./carManagement').updateHoldStatus,
  addUnavailableDates: require('./carManagement').addUnavailableDates,
  removeUnavailableDates: require('./carManagement').removeUnavailableDates,
  incrementRentedCount: require('./carManagement').incrementRentedCount,
  updateRating: require('./carManagement').updateRating,
  holdCarDates: require('./holdCarDates').holdCarDates,
  releaseCarDates: require('./releaseCarDates').releaseCarDates,
  
  // Delete operations
  deleteCar: require('./updateCar').deleteCar,
  hardDeleteCar: require('./updateCar').hardDeleteCar
};
