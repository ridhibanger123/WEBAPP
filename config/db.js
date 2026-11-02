const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas using Mongoose
 * This function is asynchronous because connecting over the network takes a moment.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Exit process with failure code (1) if database cannot connect
    process.exit(1);
  }
};

module.exports = connectDB;
