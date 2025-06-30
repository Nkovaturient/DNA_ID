import { createPow } from '@textile/powergate-client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const host = process.env.POWERGATE_HOST || 'http://localhost:6002';
let pow: any= null;

export const initializePowergate = async () => {
  try {
    if (!pow) {
      pow = createPow({ host });
      console.log('[Powergate] Client initialized.');
    }
  } catch (error) {
    console.error('[Powergate] Initialization failed:', error);
  }
};

export const getPowergateInstance = () => {
  if (!pow) {
    throw new Error('Powergate instance not initialized');
  }
  return pow;
};
