const { getClient, connectRedis } = require('./utils/redis');

async function clearCarCache() {
  try {
    // Connect to Redis first
    await connectRedis();
    const client = getClient();
    if (!client) {
      console.log('❌ Redis client not connected');
      return;
    }

    // Get all keys matching "cars:*"
    const keys = await client.keys('cars:*');
    console.log(`Found ${keys.length} car cache keys to clear`);

    if (keys.length > 0) {
      // Delete all car-related keys
      const result = await client.del(keys);
      console.log(`✅ Cleared ${result} car cache keys`);
    } else {
      console.log('📭 No car cache keys found');
    }

    console.log('🎯 Car cache cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing car cache:', error.message);
  }
}

clearCarCache().then(() => {
  process.exit(0);
});
