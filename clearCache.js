const { clearCache } = require('./utils/redis');

async function clearAllCache() {
  try {
    await clearCache('bookings');
    console.log('✅ Bookings cache cleared successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    process.exit(1);
  }
}

clearAllCache();
