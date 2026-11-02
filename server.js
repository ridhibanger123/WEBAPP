require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Import Route handlers
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Verify if user has configured their real MongoDB URI
const isPlaceholderUri =
  !process.env.MONGODB_URI ||
  process.env.MONGODB_URI.includes('<username>') ||
  process.env.MONGODB_URI.includes('your-cluster-url') ||
  process.env.MONGODB_URI.includes('<db_password>') ||
  process.env.MONGODB_URI.includes('<password>');

// Connect to MongoDB Atlas
if (!isPlaceholderUri) {
  connectDB();
} else {
  console.log('\n======================================================');
  console.log('⚠️  ACTION REQUIRED: Set your MongoDB Atlas URI in .env');
  console.log('   Open the .env file and replace MONGODB_URI with');
  console.log('   your real connection string from MongoDB Atlas.');
  console.log('======================================================\n');
}

// 1. Core Middlewares
app.use(cors());
app.use(express.json()); // Parses incoming JSON payloads
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded form data

// 2. Session Configuration
const sessionOptions = {
  secret: process.env.SESSION_SECRET || 'student_mgmt_secret_college_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day in milliseconds
    httpOnly: true, // Prevents client-side scripts from reading cookie (XSS protection)
    secure: process.env.NODE_ENV === 'production', // true only in production HTTPS
    sameSite: 'lax',
  },
};

// If valid MongoDB URI is present, persist sessions in MongoDB Atlas
if (!isPlaceholderUri) {
  sessionOptions.store = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60, // 1 day
  });
}

app.use(session(sessionOptions));

// 3. Serve Frontend Static Assets (HTML, CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// 4. API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);

// Health check endpoint (helpful for postman and testing)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    database: isPlaceholderUri ? 'Awaiting Atlas URI in .env' : 'Connected',
    timestamp: new Date(),
  });
});

// 5. Catch-all for undefined API routes (Express 5 compatible)
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found`,
  });
});

// 6. Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error. Please check server logs.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 7. Start Express Server
app.listen(PORT, () => {
  console.log(`\n🚀 Student Management System Server running on: http://localhost:${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🖥️  Frontend Login: http://localhost:${PORT}/index.html\n`);
});
