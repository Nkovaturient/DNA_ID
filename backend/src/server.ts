import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { configureBioAgents, } from './bioagents';
import { resolveDID } from './routes/resolve';
import { storageRoutes } from './routes/storage';
import { bioAgentsRoutes } from './routes/bioagents';
import { dataverseRoutes } from './routes/dataverse';
import { didRoutes } from './routes/did';
import { lighthouseRoutes } from './routes/lighthouse';
import { metadataRoutes } from './routes/metadata';
import { enhancedStorageRoutes } from './routes/enhanced-storage';
import { enhancedBioAgentsRoutes } from './routes/enhanced-bioagents';
import { enhancedDIDRoutes } from './routes/enhanced-did';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100 
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/resolve', resolveDID);
app.use('/api/storage', storageRoutes);
app.use('/api/bioagents', bioAgentsRoutes);
app.use('/api/dataverse', dataverseRoutes);
app.use('/api/did', didRoutes);
app.use('/api/lighthouse', lighthouseRoutes);
app.use('/api/metadata', metadataRoutes);

// Enhanced routes with full integration
app.use('/api/enhanced-storage', enhancedStorageRoutes);
app.use('/api/enhanced-bioagents', enhancedBioAgentsRoutes);
app.use('/api/enhanced-did', enhancedDIDRoutes);


app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  });
});

app.get('/home', (req, res)=>{
  res.send(`Its in our DNA -- The Double Helix of Trust and Truth!🧬`);
});

async function startServer() {
  try {
    await configureBioAgents();
    console.log(' BioAgents configured successfully');

    app.listen(PORT, () => {
      console.log(`🌟 DNA_ID Backend Server running on port http://localhost:${PORT}/home`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
