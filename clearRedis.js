require('dotenv').config();
const { connectRedis, getClient, del } = require('./utils/redis');

async function clearAllCache() {
  try {
    console.log('🔗 Connecting to Redis...');
    await connectRedis();
    
    const client = getClient();
    if (!client) {
      console.log('❌ Redis client not connected');
      return;
    }

    // Get all keys
    const keys = await client.keys('*');
    console.log(`Found ${keys.length} keys:`, keys);

    if (keys.length > 0) {
      // Delete all keys
      const result = await client.del(keys);
      console.log(`✅ Cleared ${result} keys from Redis`);
    } else {
      console.log('📭 No keys found in Redis');
    }

    console.log('🎯 Redis cache cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing Redis cache:', error.message);
  }
}

clearAllCache().then(() => {
  process.exit(0);
});
