const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const connectDB = require('./config/db');
const Category = require('./models/Category');
const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security Middleware ─────────────────────────────────────────────────────

// Helmet — sets various HTTP security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS — whitelist frontend origin
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting — 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});
app.use('/api/', limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
  },
});
app.use('/api/auth/', authLimiter);

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── Static Files (uploaded receipts) ────────────────────────────────────────
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/upload', uploadRoutes);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'ExpenseTracker Pro API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found.`,
  });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error.'
      : err.message,
  });
});

// ─── Database Init & Server Start ────────────────────────────────────────────
const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', icon: '🍔', color: '#FF6B6B' },
  { name: 'Transportation', icon: '🚗', color: '#4ECDC4' },
  { name: 'Shopping', icon: '🛍️', color: '#45B7D1' },
  { name: 'Bills & Utilities', icon: '💡', color: '#96CEB4' },
  { name: 'Entertainment', icon: '🎬', color: '#FFEAA7' },
  { name: 'Health & Fitness', icon: '💪', color: '#DDA0DD' },
  { name: 'Education', icon: '📚', color: '#98D8C8' },
  { name: 'Travel', icon: '✈️', color: '#F7DC6F' },
  { name: 'Groceries', icon: '🛒', color: '#82E0AA' },
  { name: 'Other', icon: '📦', color: '#AEB6BF' },
];

const seedCategories = async () => {
  try {
    for (const cat of DEFAULT_CATEGORIES) {
      await Category.updateOne(
        { name: cat.name },
        { $setOnInsert: cat },
        { upsert: true }
      );
    }
    console.log('✅ Default categories seeded');
  } catch (error) {
    console.error('⚠️  Category seeding error:', error.message);
  }
};

const startServer = async () => {
  try {
    await connectDB();
    await seedCategories();
    console.log('✅ Database initialized');
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    console.log('⚠️  Make sure MongoDB is running.');
    console.log('   Default connection: mongodb://localhost:27017/expense_tracker');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`\n🚀 ExpenseTracker Pro API Server`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Port:        ${PORT}`);
    console.log(`   API:         http://localhost:${PORT}/api`);
    console.log(`   Health:      http://localhost:${PORT}/api/health\n`);
  });
};

// Export for testing
module.exports = app;

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer();
}
