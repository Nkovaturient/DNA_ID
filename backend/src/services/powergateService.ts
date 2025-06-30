import { getPowergateInstance } from '../powergate';
import { v4 as uuidv4 } from 'uuid';

export interface StorageConfig {
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

export interface StorageResult {
  cid: string;
  jobId?: string;
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
  };
}

export class PowergateService {
  /**
   * Store DID document on IPFS/Filecoin
   */
  async storeDIDDocument(didDocument: any): Promise<StorageResult> {
    try {
      const pow = getPowergateInstance();
      
      const buffer = Buffer.from(JSON.stringify(didDocument, null, 2));
      
      // Add to hot storage (IPFS)
      const { cid } = await pow.ffs.addToHot(buffer);
      console.log(`[Powergate] DID document added to IPFS with CID: ${cid}`);

      // Configure storage for DID documents
      const storageConfig: StorageConfig = {
        hot: {
          enabled: true,
          allowUnfreeze: true,
          ipfsAddTimeout: 30
        },
        cold: {
          enabled: true,
          filecoin: {
            repFactor: 2,
            dealMinDuration: 518400, // ~6 months
            verifiedDeal: true,
            maxPrice: 1000000000 // 1 FIL max
          }
        }
      };

      let jobId: string | undefined;
      
      // Create Filecoin storage deal if cold storage is enabled
      if (storageConfig.cold.enabled) {
        const job = await pow.ffs.pushStorageConfig(cid, storageConfig);
        jobId = job.jobId;
        console.log(`[Powergate] Storage job created: ${jobId}`);
      }

      const result: StorageResult = {
        cid,
        jobId,
        size: buffer.length,
        timestamp: new Date().toISOString(),
        hot: {
          enabled: storageConfig.hot.enabled,
          size: buffer.length,
          ipfsNode: 'default'
        }
      };

      if (jobId) {
        result.cold = {
          enabled: true,
          jobId
        };
      }

      return result;
    } catch (error) {
      console.error('[Powergate] DID document storage failed:', error);
      throw error;
    }
  }

  /**
   * Store verifiable credentials
   */
  async storeVerifiableCredentials(credentials: any[]): Promise<StorageResult> {
    try {
      const pow = getPowergateInstance();
      
      const vcCollection = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: 'VerifiableCredentialCollection',
        credentials: credentials,
        timestamp: new Date().toISOString()
      };

      const buffer = Buffer.from(JSON.stringify(vcCollection, null, 2));
      
      // Add to hot storage
      const { cid } = await pow.ffs.addToHot(buffer);
      console.log(`[Powergate] VCs added to IPFS with CID: ${cid}`);

      const result: StorageResult = {
        cid,
        size: buffer.length,
        timestamp: new Date().toISOString(),
        hot: {
          enabled: true,
          size: buffer.length,
          ipfsNode: 'default'
        }
      };

      return result;
    } catch (error) {
      console.error('[Powergate] VC storage failed:', error);
      throw error;
    }
  }

  /**
   * Store arbitrary data with custom storage configuration
   */
  async storeData(
    data: Buffer | string,
    dataType: string = 'data',
    config?: StorageConfig
  ): Promise<StorageResult> {
    try {
      const pow = getPowergateInstance();
      
      // Convert string to buffer if needed
      const buffer = typeof data === 'string' ? Buffer.from(data) : data;

      // Add to hot storage (IPFS)
      const { cid } = await pow.ffs.addToHot(buffer);
      console.log(`[Powergate] Data added to IPFS with CID: ${cid}`);

      // Use provided config or default
      const storageConfig = config || {
        hot: {
          enabled: true,
          allowUnfreeze: true
        },
        cold: {
          enabled: true,
          filecoin: {
            repFactor: 1,
            dealMinDuration: 518400, // ~6 months
            verifiedDeal: false
          }
        }
      };

      let jobId: string | undefined;
      
      // Create Filecoin storage deal if cold storage is enabled
      if (storageConfig.cold.enabled) {
        const job = await pow.ffs.pushStorageConfig(cid, storageConfig);
        jobId = job.jobId;
        console.log(`[Powergate] Storage job created: ${jobId}`);
      }

      const result: StorageResult = {
        cid,
        jobId,
        size: buffer.length,
        timestamp: new Date().toISOString(),
        hot: {
          enabled: storageConfig.hot.enabled,
          size: buffer.length,
          ipfsNode: 'default'
        }
      };

      if (jobId) {
        result.cold = {
          enabled: true,
          jobId
        };
      }

      return result;
    } catch (error) {
      console.error('[Powergate] Data storage failed:', error);
      throw error;
    }
  }

  /**
   * Retrieve data from IPFS/Filecoin
   */
  async retrieveData(cid: string): Promise<any> {
    try {
      const pow = getPowergateInstance();
      
      const stream = pow.ffs.get(cid);
      const chunks: Buffer[] = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const data = Buffer.concat(chunks);
      return JSON.parse(data.toString());
    } catch (error) {
      console.error('[Powergate] Data retrieval failed:', error);
      throw error;
    }
  }

  /**
   * Get storage job status
   */
  async getJobStatus(jobId: string): Promise<any> {
    try {
      const pow = getPowergateInstance();
      const job = await pow.ffs.watchJobs((job: any) => job.id === jobId);
      return job;
    } catch (error) {
      console.error('[Powergate] Job status check failed:', error);
      throw error;
    }
  }

  /**
   * Get storage info for a CID
   */
  async getStorageInfo(cid: string): Promise<any> {
    try {
      const pow = getPowergateInstance();
      const info = await pow.ffs.show(cid);
      return info;
    } catch (error) {
      console.error('[Powergate] Storage info retrieval failed:', error);
      throw error;
    }
  }

  /**
   * List all stored data
   */
  async listStoredData(): Promise<any[]> {
    try {
      const pow = getPowergateInstance();
      const list = await pow.ffs.list();
      return list;
    } catch (error) {
      console.error('[Powergate] Data listing failed:', error);
      throw error;
    }
  }
}

export const powergateService = new PowergateService();
