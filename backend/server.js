const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/db');

const app = express();

// ──────────────────────────────────────────────
// Security & Middleware
// ──────────────────────────────────────────────

// Helmet sets secure HTTP headers
app.use(helmet());

// Allow requests from the frontend client securely
app.use(cors({
  origin: function (origin, callback) {
    // Allow local development and Vercel deployments
    if (!origin || origin.startsWith('http://localhost') || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Rate limiting — 1000 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Body parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// HTTP request logger (disabled in test)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ──────────────────────────────────────────────
// DB Connection Middleware (MUST be before routes)
// ──────────────────────────────────────────────
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('❌ DB connection failed:', err.message);
    res.status(500).json({ success: false, message: 'Database connection failed' });
  }
});

// ──────────────────────────────────────────────
// Health check endpoint (no DB needed)
// ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Khatabook API is running 🚀', env: process.env.NODE_ENV });
});

// ──────────────────────────────────────────────
// Debug endpoint: test MongoDB connection
// ──────────────────────────────────────────────
app.get('/api/debug/db', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const uri = process.env.MONGO_URI || 'NOT SET';
    const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
    
    if (!process.env.MONGO_URI) {
      return res.status(500).json({ success: false, message: 'MONGO_URI not set', uri: 'NOT SET' });
    }

    await connectDB();
    res.json({
      success: true,
      message: 'MongoDB connected!',
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      uri: maskedUri,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, uri: (process.env.MONGO_URI || 'NOT SET').replace(/:([^@]+)@/, ':****@') });
  }
});

// ──────────────────────────────────────────────
// API Routes
// ──────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/contacts', require('./routes/contact.routes'));
app.use('/api/transactions', require('./routes/transaction.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/reports', require('./routes/report.routes'));
app.use('/api/business', require('./routes/business.routes'));
app.use('/api/todos', require('./routes/todo.routes'));

// ──────────────────────────────────────────────
// 404 Handler
// ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ──────────────────────────────────────────────
// Global Error Handler
// ──────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Global Error:', err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ──────────────────────────────────────────────
// Local dev: start HTTP server
// ──────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  });
}

module.exports = app; // Vercel serverless entry point
