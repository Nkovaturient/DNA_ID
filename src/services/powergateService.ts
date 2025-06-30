// DEPRECATED: Frontend Powergate service removed.
// All Powergate operations now handled by backend API.
// Use integrationService.uploadToFilecoin() instead.

import { DID, VerifiableCredential } from '../types';

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

export interface StorageJob {
  id: string;
  cid: string;
  status: 'queued' | 'executing' | 'success' | 'failed' | 'cancelled';
  errorCause?: string;
  dealInfo?: {
    proposalCid: string;
    miner: string;
    price: string;
    duration: number;
  }[];
}

export class PowergateService {
  private client: any = null;
  private token: string | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeClient();
  }

  /**
   * Initialize Powergate client
   */
  private async initializeClient(): Promise<void> {
    try {
      const powergateHost = import.meta.env.VITE_POWERGATE_HOST || 'http://localhost:5173';      
      this.client = createPow({
        host: powergateHost,
        debug: import.meta.env.DEV || false,
      });

      this.isInitialized = true;
      console.log('[Powergate] Client initialized successfully');
    } catch (error: any) {
      console.error('[Powergate] Initialization failed:', error);
      throw new Error(`Powergate initialization failed: ${error.message}`);
    }
  }

  /**
   * Create new user and get auth token
   */
  async createUser(): Promise<string> {
    try {
      if (!this.client) {
        await this.initializeClient();
      }

      // Check if we have a stored token
      const storedToken = localStorage.getItem('powergate_token');
      if (!storedToken) {
      const { user } = await this.client.admin.users.create();
      this.token = user?.token;
      this.client.setAdminToken(this.token);
     localStorage.setItem('powergate_token', user?.token)
      } else {
        this.client.setToken(storedToken)
      }
      
      console.log('[Powergate] New user created with token');
      return this.token;
    } catch (error) {
      console.error('[Powergate] User creation failed:', error);
      throw error;
    }
  }

  /**
   * Set authentication token
   */
  // setToken(token: string): void {
  //   this.token = token;
  //   if (this.client) {
  //     this.client.setToken(token);
  //     localStorage.setItem('powergate_token', token);
  //   }
  // }

  /**
   * Get wallet info
   */
  async getWalletInfo(): Promise<any> {
    try {
      if (!this.client) {
        throw new Error('Powergate client not initialized or no auth token');
      }

      const info = await this.client.buildInfo();
      return info;
    } catch (error) {
      console.error('[Powergate] Failed to get wallet info:', error);
      throw error;
    }
  }

  /**
   * Store DID document on IPFS/Filecoin
   */
  async storeDIDDocument(did: DID): Promise<StorageResult> {
    try {
      if (!this.client) {
        throw new Error('Powergate client not initialized or no auth token');
      }

      const didDocument = {
        '@context': ['https://www.w3.org/ns/did/v1'],
        id: did.id,
        controller: did.id,
        created: did.created.toISOString(),
        updated: new Date().toISOString(),
        metadata: did.metadata,
        storage: did.storage,
        gdprConsent: did.gdprConsent,
        verifiableCredentials: did.verifiableCredentials?.map(vc => vc.id) || [],
        service: [
          {
            id: `${did.id}#dataverse`,
            type: 'DataverseService',
            serviceEndpoint: did.id ? `https://demo.dataverse.org/dataset.xhtml?persistentId=${did.id}` : null
          }
        ]
      };

      const buffer = Buffer.from(JSON.stringify(didDocument, null, 2));
      return await this.storeData(buffer, 'did-document', {
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
      });
    } catch (error) {
      console.error('[Powergate] DID document storage failed:', error);
      throw error;
    }
  }

  /**
   * Store verifiable credentials
   */
  async storeVerifiableCredentials(credentials: VerifiableCredential[]): Promise<StorageResult> {
    try {
      if (!this.client) {
        throw new Error('Powergate client not initialized or no auth token');
      }

      const vcCollection = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: 'VerifiableCredentialCollection',
        credentials: credentials,
        timestamp: new Date().toISOString()
      };

      const buffer = Buffer.from(JSON.stringify(vcCollection, null, 2));
      return await this.storeData(buffer, 'verifiable-credentials');
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
      if (!this.client) {
        throw new Error('Powergate client not initialized or no auth token');
      }

      // Convert string to buffer if needed
      const buffer = typeof data === 'string' ? Buffer.from(data) : data;

      // Add to hot storage (IPFS)
      const { cid } = await this.client.ffs.addToHot(buffer);
      console.log(`[Powergate] Data added to IPFS with CID: ${cid}`);

      // Prepare storage config
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
        const job = await this.client.ffs.pushStorageConfig(cid, storageConfig);
        jobId = job.jobId;
        console.log(`[Powergate] Storage job created: ${jobId}`);
      }

      // Get storage info
      const info = await this.client.ffs.info();
      
      const result: StorageResult = {
        cid,
        jobId,
        size: buffer.length,
        timestamp: new Date().toISOString(),
        hot: {
          enabled: storageConfig.hot.enabled,
          size: buffer.length,
          ipfsNode: info.defaultStorageConfig?.hot?.ipfs?.addTimeout || 'default'
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
      if (!this.client) {
        throw new Error('Powergate client not initialized or no auth token');
      }

      const stream = this.client.ffs.get(cid);
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
  async getJobStatus(jobId: string): Promise<StorageJob> {
    try {
      if (!this.client || !this.token) {
        throw new Error('Powergate client not initialized or no auth token');
      }

      const job = await this.client.ffs.watchJobs((job: any) => job.id === jobId);
      
      return {
        id: job.id,
        cid: job.cid,
        status: job.status,
        errorCause: job.errorCause,
        dealInfo: job.dealInfo
      };
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
      if (!this.client || !this.token) {
        throw new Error('Powergate client not initialized or no auth token');
      }

      const info = await this.client.ffs.show(cid);
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
      if (!this.client || !this.token) {
        throw new Error('Powergate client not initialized or no auth token');
      }

      const list = await this.client.ffs.list();
      return list;
    } catch (error) {
      console.error('[Powergate] Data listing failed:', error);
      throw error;
    }
  }

  /**
   * Remove data from storage
   */
  async removeData(cid: string): Promise<void> {
    try {
      if (!this.client || !this.token) {
        throw new Error('Powergate client not initialized or no auth token');
      }

      await this.client.ffs.remove(cid);
      console.log(`[Powergate] Data removed: ${cid}`);
    } catch (error) {
      console.error('[Powergate] Data removal failed:', error);
      throw error;
    }
  }

  /**
   * Get Filecoin network info
   */
  async getNetworkInfo(): Promise<any> {
    try {
      if (!this.client) {
        throw new Error('Powergate client not initialized');
      }

      const info = await this.client.net.info();
      return info;
    } catch (error) {
      console.error('[Powergate] Network info retrieval failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const powergateService = new PowergateService();
