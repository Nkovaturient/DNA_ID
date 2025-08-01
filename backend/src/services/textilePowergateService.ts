import { createPow } from '@textile/powergate-client';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

export interface PowergateStorageConfig {
  hot: {
    enabled: boolean;
    allowUnfreeze: boolean;
    ipfsAddTimeout?: number;
  };
  cold: {
    enabled: boolean;
    filecoin: {
      repFactor: number;
      dealMinDuration: number;
      excludedMiners?: string[];
      trustedMiners?: string[];
      countryCodeFilter?: string[];
      maxPrice?: number;
      verifiedDeal?: boolean;
    };
  };
}

export interface PowergateStorageResult {
  cid: string;
  jobId: string;
  size: number;
  timestamp: string;
  hot: {
    enabled: boolean;
    size: number;
    ipfsNode: string;
  };
  cold?: {
    enabled: boolean;
    jobId: string;
    dealId?: string;
    status: 'queued' | 'executing' | 'success' | 'failed';
  };
}

export interface PowergateJobStatus {
  id: string;
  cid: string;
  status: 'queued' | 'executing' | 'success' | 'failed' | 'cancelled';
  errorCause?: string;
  dealInfo?: Array<{
    proposalCid: string;
    miner: string;
    price: string;
    duration: number;
    verified: boolean;
  }>;
  createdAt: number;
  updatedAt: number;
}

export class TextilePowergateService {
  private client: any = null;
  private userToken: string | null = null;
  private host: string;
  private isInitialized = false;

  constructor() {
    this.host = process.env.POWERGATE_HOST || 'http://localhost:6002';
  }

  /**
   * Initialize Powergate client and create user if needed
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      console.log(`[Powergate] Initializing client for host: ${this.host}`);
      
      // Create Powergate client
      this.client = createPow({ host: this.host });
      
      // Check if we have a stored user token
      const storedToken = process.env.POWERGATE_USER_TOKEN;
      
      if (storedToken) {
        this.userToken = storedToken;
        this.client.setToken(storedToken);
        console.log('[Powergate] Using stored user token');
      } else {
        // Create a new user
        const { user } = await this.client.admin.users.create();
        this.userToken = user.token;
        this.client.setToken(this.userToken);
        console.log('[Powergate] New user created with token:', this.userToken);
        console.log('[Powergate] Save this token to POWERGATE_USER_TOKEN environment variable');
      }
      
      // Test the connection
      await this.client.health.check();
      console.log('[Powergate] Health check passed');
      
      // Get FFS info to verify authentication
      const info = await this.client.ffs.info();
      console.log('[Powergate] FFS info retrieved, authentication successful');
      
      this.isInitialized = true;
    } catch (error) {
      console.error('[Powergate] Initialization failed:', error);
      throw new Error(`Powergate initialization failed: ${error}`);
    }
  }

  /**
   * Store data on IPFS/Filecoin with custom configuration
   */
  async storeData(
    data: Buffer | string,
    dataType: string = 'data',
    config?: PowergateStorageConfig
  ): Promise<PowergateStorageResult> {
    try {
      await this.initialize();
      
      const buffer = typeof data === 'string' ? Buffer.from(data) : data;
      
      console.log(`[Powergate] Storing ${dataType} (${buffer.length} bytes)`);
      
      // Default storage configuration
      const defaultConfig: PowergateStorageConfig = {
        hot: {
          enabled: true,
          allowUnfreeze: true,
          ipfsAddTimeout: 30000
        },
        cold: {
          enabled: true,
          filecoin: {
            repFactor: 1,
            dealMinDuration: 518400, // ~6 months
            verifiedDeal: false,
            maxPrice: 1000000000000000 // 0.001 FIL
          }
        }
      };

      const storageConfig = config || defaultConfig;
      
      // Stage data to IPFS first
      const { cid } = await this.client.ffs.stage(buffer);
      console.log(`[Powergate] Data staged with CID: ${cid}`);
      
      // Apply storage configuration
      const { jobId } = await this.client.ffs.pushStorageConfig(cid, {
        hot: storageConfig.hot,
        cold: storageConfig.cold
      });
      
      console.log(`[Powergate] Storage job created: ${jobId}`);
      
      // Monitor job status
      const jobStatus = await this.waitForJobCompletion(jobId, 300000); // 5 minutes timeout
      
      const result: PowergateStorageResult = {
        cid,
        jobId,
        size: buffer.length,
        timestamp: new Date().toISOString(),
        hot: {
          enabled: storageConfig.hot.enabled,
          size: buffer.length,
          ipfsNode: 'powergate-ipfs'
        },
        cold: storageConfig.cold.enabled ? {
          enabled: true,
          jobId,
          status: jobStatus.status,
          dealId: jobStatus.dealInfo?.[0]?.proposalCid
        } : undefined
      };

      console.log(`[Powergate] Storage completed successfully:`, {
        cid,
        jobId,
        status: jobStatus.status
      });
      
      return result;
    } catch (error) {
      console.error('[Powergate] Data storage failed:', error);
      throw new Error(`Powergate storage failed: ${error}`);
    }
  }

  /**
   * Store DID document with optimized configuration
   */
  async storeDIDDocument(didDocument: any): Promise<PowergateStorageResult> {
    const didConfig: PowergateStorageConfig = {
      hot: {
        enabled: true,
        allowUnfreeze: true,
        ipfsAddTimeout: 30000
      },
      cold: {
        enabled: true,
        filecoin: {
          repFactor: 2, // Higher replication for important DID documents
          dealMinDuration: 1051200, // ~1 year
          verifiedDeal: true,
          maxPrice: 5000000000000000 // 0.005 FIL
        }
      }
    };

    const didPackage = {
      '@context': ['https://www.w3.org/ns/did/v1'],
      ...didDocument,
      stored: new Date().toISOString(),
      storageProvider: 'textile-powergate',
      version: '1.0.0'
    };

    return this.storeData(
      JSON.stringify(didPackage, null, 2),
      'did-document',
      didConfig
    );
  }

  /**
   * Store verifiable credentials collection
   */
  async storeVerifiableCredentials(credentials: any[]): Promise<PowergateStorageResult> {
    const vcCollection = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: 'VerifiableCredentialCollection',
      credentials,
      timestamp: new Date().toISOString(),
      id: `urn:vc-collection:${uuidv4()}`
    };

    return this.storeData(
      JSON.stringify(vcCollection, null, 2),
      'verifiable-credentials'
    );
  }

  /**
   * Retrieve data from IPFS/Filecoin
   */
  async retrieveData(cid: string): Promise<any> {
    try {
      await this.initialize();
      
      console.log(`[Powergate] Retrieving data with CID: ${cid}`);
      
      const stream = this.client.ffs.get(cid);
      const chunks: Buffer[] = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const data = Buffer.concat(chunks);
      const result = JSON.parse(data.toString());
      
      console.log(`[Powergate] Data retrieved successfully (${data.length} bytes)`);
      return result;
    } catch (error) {
      console.error('[Powergate] Data retrieval failed:', error);
      throw new Error(`Powergate retrieval failed: ${error}`);
    }
  }

  /**
   * Get detailed job status
   */
  async getJobStatus(jobId: string): Promise<PowergateJobStatus> {
    try {
      await this.initialize();
      
      const jobs = await this.client.ffs.listStorageJobs();
      const job = jobs.storageJobs.find((j: any) => j.id === jobId);
      
      if (!job) {
        throw new Error(`Job not found: ${jobId}`);
      }

      return {
        id: job.id,
        cid: job.cid,
        status: job.status,
        errorCause: job.errorCause,
        dealInfo: job.dealInfo?.map((deal: any) => ({
          proposalCid: deal.proposalCid,
          miner: deal.miner,
          price: deal.price,
          duration: deal.duration,
          verified: deal.verified
        })),
        createdAt: job.createdAt,
        updatedAt: job.updatedAt
      };
    } catch (error) {
      console.error('[Powergate] Job status retrieval failed:', error);
      throw error;
    }
  }

  /**
   * Get storage information for a CID
   */
  async getStorageInfo(cid: string): Promise<any> {
    try {
      await this.initialize();
      
      const info = await this.client.ffs.show(cid);
      return {
        cid: info.cid,
        hot: info.hot,
        cold: info.cold,
        created: info.created,
        updated: info.updated
      };
    } catch (error) {
      console.error('[Powergate] Storage info retrieval failed:', error);
      throw error;
    }
  }

  /**
   * List all stored data for the current user
   */
  async listStoredData(): Promise<any[]> {
    try {
      await this.initialize();
      
      const list = await this.client.ffs.list();
      return list.map((item: any) => ({
        cid: item.cid,
        size: item.size,
        hot: item.hot,
        cold: item.cold,
        created: item.created
      }));
    } catch (error) {
      console.error('[Powergate] Data listing failed:', error);
      throw error;
    }
  }

  /**
   * Wait for job completion with timeout
   */
  private async waitForJobCompletion(jobId: string, timeoutMs: number = 300000): Promise<PowergateJobStatus> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const status = await this.getJobStatus(jobId);
      
      if (status.status === 'success' || status.status === 'failed' || status.status === 'cancelled') {
        return status;
      }
      
      // Wait 5 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    throw new Error(`Job ${jobId} timed out after ${timeoutMs}ms`);
  }

  /**
   * Test Powergate connection and functionality
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.initialize();
      
      // Test with small data
      const testData = JSON.stringify({
        test: true,
        timestamp: new Date().toISOString(),
        message: 'Powergate connection test'
      });
      
      const result = await this.storeData(testData, 'test');
      console.log('[Powergate] Connection test successful:', result.cid);
      
      // Verify retrieval
      const retrieved = await this.retrieveData(result.cid);
      console.log('[Powergate] Retrieval test successful');
      
      return true;
    } catch (error) {
      console.error('[Powergate] Connection test failed:', error);
      return false;
    }
  }

  /**
   * Get Powergate instance info
   */
  async getInstanceInfo(): Promise<any> {
    try {
      await this.initialize();
      
      const [health, info, balance] = await Promise.all([
        this.client.health.check(),
        this.client.ffs.info(),
        this.client.wallet.balance()
      ]);

      return {
        health,
        ffsInfo: info,
        walletBalance: balance,
        userToken: this.userToken,
        host: this.host
      };
    } catch (error) {
      console.error('[Powergate] Instance info retrieval failed:', error);
      throw error;
    }
  }

  /**
   * Remove data from storage (GDPR compliance)
   */
  async removeData(cid: string): Promise<void> {
    try {
      await this.initialize();
      
      await this.client.ffs.remove(cid);
      console.log(`[Powergate] Data removed: ${cid}`);
    } catch (error) {
      console.error('[Powergate] Data removal failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const textilePowergateService = new TextilePowergateService();