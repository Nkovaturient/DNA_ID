// Frontend Powergate service - now uses backend API
// All Powergate operations are handled by the backend server

import { DID, VerifiableCredential } from '../types';

// Backend API configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

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
  private isInitialized = false;

  constructor() {
    this.isInitialized = true;
    console.log('[Powergate] Frontend service initialized - using backend API');
  }

  /**
   * Check backend connectivity
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('[Powergate] Backend connection failed:', error);
      return false;
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
   * Store arbitrary data using backend API
   */
  async storeData(
    data: Buffer | string,
    dataType: string = 'data',
    config?: StorageConfig
  ): Promise<StorageResult> {
    try {
      if (!this.isInitialized) {
        throw new Error('Powergate client not initialized or no auth token');
      }

      // Convert data to base64 for transport
      const dataToSend = typeof data === 'string' ? data : data.toString('base64');
      
      const response = await fetch(`${BACKEND_URL}/api/storage/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: dataToSend,
          dataType,
          config
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Storage upload failed');
      }

      const result = await response.json();
      console.log(`[Powergate] Data stored via backend API: ${result.data.cid}`);
      
      return result.data;
    } catch (error: any) {
      console.error('[Powergate] Data storage failed:', error);
      throw new Error(`Powergate client not initialized or no auth token`);
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
