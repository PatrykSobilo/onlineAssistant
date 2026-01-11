import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// import connectDB from './config/database.js'; // Temporarily disabled - starting without DB

// Import routes
import authRoutes from './routes/authRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
// import noteRoutes from './routes/noteRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database - DISABLED FOR NOW (starting with in-memory storage)
// connectDB();

// In-memory storage for MVP (will be replaced with MongoDB later)
let notes = [];

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
    version: '1.0.0'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);

// API Routes - MVP endpoints (in-memory)
app.post('/api/notes', (req, res) => {
  const note = {
    id: Date.now(),
    text: req.body.text || '',
    transcription: req.body.transcription || '',
    createdAt: new Date().toISOString()
  };
  notes.push(note);
  console.log('📝 Note created:', note);
  res.json({ success: true, note });
});

app.get('/api/notes', (req, res) => {
  console.log('📋 Fetching notes, count:', notes.length);
  res.json({ success: true, notes });
});

app.delete('/api/notes/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const initialLength = notes.length;
  notes = notes.filter(note => note.id !== id);
  const deleted = initialLength > notes.length;
  console.log('🗑️ Note deleted:', id, deleted);
  res.json({ success: deleted });
});

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

export default app;
