const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the URI from environment variables.
 * Retries on failure after 5 seconds.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    // Retry after 5 seconds instead of crashing immediately
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;
