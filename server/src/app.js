const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });
const { testConnection, sequelize } = require('./config/database');
const { syncDatabase } = require('./models/index');

// Import routes
const authRoutes = require('./routes/authRoutes');
const aiRoutes = require('./routes/aiRoutes');
const noteCategoryRoutes = require('./routes/noteCategoryRoutes');
const noteSubCategoryRoutes = require('./routes/noteSubCategoryRoutes');
const noteRoutes = require('./routes/noteRoutes');
const discussionRoutes = require('./routes/discussionRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Test database connection and sync models
testConnection();
syncDatabase();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: '🤖 Online Assistant API',
    status: 'running',
    version: '1.0.0',
    database: 'MySQL with Sequelize (XAMPP)'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/categories', noteCategoryRoutes);
app.use('/api/subcategories', noteSubCategoryRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/settings', settingsRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app;
