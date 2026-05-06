import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import scanRoutes from './routes/scanRoutes.js';
import vitalRoutes from './routes/vitalRoutes.js';
import triageRoutes from './routes/triageRoutes.js';

dotenv.config();

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/vitals', vitalRoutes);
app.use('/api/triage', triageRoutes);

// Health Check
app.get('/', (req, res) => {
  res.send('MediGuard API is running...');
});

// Global 404 Catch-all (Returns JSON instead of HTML)
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found on this server` });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
