import { createPow } from '@textile/powergate-client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const host = process.env.POWERGATE_HOST || 'http://localhost:6002';
let pow: any = null;
let userToken: string | null = null;

export const initializePowergate = async () => {
  try {
    if (!pow) {
      // Create Powergate client
      pow = createPow({ host });
      console.log(`[Powergate] Client created for host: ${host}`);
      
      // Check if we have a stored user token
      const storedToken = process.env.POWERGATE_USER_TOKEN;
      
      if (storedToken) {
        // Use existing token
        pow.setToken(storedToken);
        userToken = storedToken;
        console.log('[Powergate] Using stored user token');
      } else {
        // Create a new user
        const { user } = await pow.admin?.users?.create();
        userToken = user.token;
        pow.setToken(userToken);
        console.log('[Powergate] New user created with token');
        console.log(`[Powergate] Save this token for future use: ${userToken}`);
      }
      
      // Test the connection
      await pow.health.check();
      console.log('[Powergate] Health check passed');
      
      // Get FFS info to verify authentication
      try {
        const info = await pow.ffs.info();
        console.log('[Powergate] FFS info retrieved, authentication successful');
      } catch (ffsError) {
        console.warn('[Powergate] FFS info failed, but client is initialized:', ffsError);
      }
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

export const getUserToken = () => {
  return userToken;
};
