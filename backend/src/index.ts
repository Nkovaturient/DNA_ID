import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { initializePowergate } from './powergate';
import { configureBioAgents } from './bioagents';
import { resolveDID } from './routes/resolve';
import { storageRoutes } from './routes/storage';

// Load environment variables
dotenv.config();

// Initialize app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true}));
app.use(morgan('dev'));

// Initialize Powergate
initializePowergate();

// Configure BioAgents
configureBioAgents();

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'its in your DNA',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      powergate: 'Available',
      bioagents: 'Available',
      resolver: 'Available'
    }
  });
});

// API Routes
app.use('/resolve', resolveDID);
app.use('/api/storage', storageRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

