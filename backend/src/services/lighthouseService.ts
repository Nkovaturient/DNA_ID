import lighthouse from '@lighthouse-web3/sdk';
import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';

export interface LighthouseUploadResponse {
  Name: string;
  Hash: string;
  Size: string;
  dealId?: string;
  Status: 'uploaded' | 'pinned' | 'queued' | 'failed';
}

export interface LighthouseFileInfo {
  publicKey: string;
  fileName: string;
  mimeType: string;
  txHash: string;
  status: string;
  createdAt: number;
  fileSizeInBytes: string;
  cid: string;
  id: string;
  lastUpdate: number;
  encryption: boolean;
}

export interface LighthouseStorageOptions {
  dealParams?: {
    miner?: string[];
    network?: 'calibration' | 'mainnet';
    epochs?: number;
    replication_target?: number;
    repair_threshold?: number;
    renew_threshold?: number;
  };
  encryption?: {
    enabled: boolean;
    accessControlConditions?: any[];
  };
}

export class LighthouseService {
  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.LIGHTHOUSE_API_KEY || '';
    this.baseUrl = 'https://node.lighthouse.storage';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 60000, // 60 seconds for large file uploads
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[Lighthouse API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[Lighthouse API Error]:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Upload file to Lighthouse with optional Filecoin storage
   */
  async uploadFile(
    file: File | Buffer, 
    fileName: string,
    options: LighthouseStorageOptions = {}
  ): Promise<LighthouseUploadResponse> {
    try {
      const formData = new FormData();
      
      if (file instanceof File) {
        formData.append('file', file, fileName);
      } else {
        // Handle Buffer
        formData.append('file', file, {
          filename: fileName,
          contentType: 'application/octet-stream',
        });
      }

      // Add deal parameters if specified
      if (options.dealParams) {
        formData.append('dealParams', JSON.stringify(options.dealParams));
      }

      const response = await this.client.post('/api/v0/add', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      console.log('[Lighthouse] File uploaded successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('[Lighthouse] File upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload JSON metadata to Lighthouse
   */
  async uploadJSON(
    jsonData: object,
    fileName: string,
    options: LighthouseStorageOptions = {}
  ): Promise<LighthouseUploadResponse> {
    try {
      const jsonString = JSON.stringify(jsonData, null, 2);
      const buffer = Buffer.from(jsonString, 'utf-8');
      
      return this.uploadFile(buffer, fileName, options);
    } catch (error) {
      console.error('[Lighthouse] JSON upload failed:', error);
      throw error;
    }
  }

  /**
   * Store DID document with metadata
   */
  async storeDIDDocument(
    didDocument: object,
    metadata: any = {},
    options: LighthouseStorageOptions = {}
  ): Promise<{
    didDocumentCid: string;
    metadataCid: string;
    uploadResponse: LighthouseUploadResponse;
  }> {
    try {
      // Create comprehensive metadata package
      const didPackage = {
        didDocument,
        metadata: {
          ...metadata,
          storedAt: new Date().toISOString(),
          version: '1.0.0',
          type: 'DIDDocument',
          gdprCompliant: true,
        },
        auditTrail: {
          created: new Date().toISOString(),
          service: 'Lighthouse',
          network: options.dealParams?.network || 'calibration'
        }
      };

      // Upload DID package
      const uploadResponse = await this.uploadJSON(
        didPackage,
        `did-document-${Date.now()}.json`,
        {
          ...options,
          dealParams: {
            network: 'calibration',
            epochs: 4320, // ~1 month
            replication_target: 2,
            ...options.dealParams
          }
        }
      );

      return {
        didDocumentCid: uploadResponse.Hash,
        metadataCid: uploadResponse.Hash, // Same for combined package
        uploadResponse
      };
    } catch (error) {
      console.error('[Lighthouse] DID document storage failed:', error);
      throw error;
    }
  }

  /**
   * Store enriched dataset metadata
   */
  async storeEnrichedMetadata(
    enrichedMetadata: object,
    options: LighthouseStorageOptions = {}
  ): Promise<LighthouseUploadResponse> {
    try {
      const metadataPackage = {
        enrichedMetadata,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        type: 'EnrichedMetadata',
        gdprCompliant: true,
      };

      return this.uploadJSON(
        metadataPackage,
        `enriched-metadata-${Date.now()}.json`,
        options
      );
    } catch (error) {
      console.error('[Lighthouse] Enriched metadata storage failed:', error);
      throw error;
    }
  }

  /**
   * Get file information by CID
   */
  async getFileInfo(cid: string): Promise<LighthouseFileInfo> {
    try {
      const response = await this.client.get(`/api/lighthouse/file_info?cid=${cid}`);
      return response.data;
    } catch (error) {
      console.error('[Lighthouse] Get file info failed:', error);
      throw error;
    }
  }

  /**
   * Get upload status
   */
  async getUploadStatus(fileName: string): Promise<any> {
    try {
      const response = await this.client.get(`/api/lighthouse/uploads?fileName=${fileName}`);
      return response.data;
    } catch (error) {
      console.error('[Lighthouse] Get upload status failed:', error);
      throw error;
    }
  }

  /**
   * Get deal status for a file
   */
  async getDealStatus(cid: string): Promise<any> {
    try {
      const response = await this.client.get(`/api/lighthouse/get_proof?cid=${cid}&network=calibration`);
      return response.data;
    } catch (error) {
      console.error('[Lighthouse] Get deal status failed:', error);
      throw error;
    }
  }

  /**
   * Retrieve file content by CID
   */
  async retrieveFile(cid: string): Promise<any> {
    try {
      const response = await axios.get(`https://gateway.lighthouse.storage/ipfs/${cid}`);
      return response.data;
    } catch (error) {
      console.error('[Lighthouse] File retrieval failed:', error);
      throw error;
    }
  }

  /**
   * Test connection to Lighthouse
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/lighthouse/user_uploads?pageNo=1');
      console.log('[Lighthouse] Connection successful');
      return true;
    } catch (error) {
      console.error('[Lighthouse] Connection failed:', error);
      return false;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<any> {
    try {
      const response = await this.client.get('/api/lighthouse/get_uploads');
      return response.data;
    } catch (error) {
      console.error('[Lighthouse] Get storage stats failed:', error);
      throw error;
    }
  }

  /**
   * Create a complete storage workflow for DID infrastructure
   */
  async storeComplete(data: {
    didDocument: object;
    enrichedMetadata: object;
    originalFile?: File | Buffer;
    fileName?: string;
    metadata?: any;
  }): Promise<{
    didDocumentResult: any;
    metadataResult: LighthouseUploadResponse;
    fileResult?: LighthouseUploadResponse;
    summary: {
      totalSize: number;
      cids: string[];
      status: string;
      timestamp: string;
    };
  }> {
    try {
      console.log('[Lighthouse] Starting complete storage workflow...');

      // Store DID Document
      const didDocumentResult = await this.storeDIDDocument(
        data.didDocument,
        data.metadata,
        {
          dealParams: {
            network: 'calibration',
            epochs: 4320, // ~1 month
            replication_target: 2,
          }
        }
      );

      // Store enriched metadata
      const metadataResult = await this.storeEnrichedMetadata(
        data.enrichedMetadata,
        {
          dealParams: {
            network: 'calibration',
            epochs: 4320,
            replication_target: 2,
          }
        }
      );

      // Store original file if provided
      let fileResult: LighthouseUploadResponse | undefined;
      if (data.originalFile && data.fileName) {
        fileResult = await this.uploadFile(
          data.originalFile,
          data.fileName,
          {
            dealParams: {
              network: 'calibration',
              epochs: 4320,
              replication_target: 2,
            }
          }
        );
      }

      const cids = [
        didDocumentResult.didDocumentCid,
        metadataResult.Hash,
        ...(fileResult ? [fileResult.Hash] : [])
      ];

      const summary = {
        totalSize: parseInt(didDocumentResult.uploadResponse.Size) + 
                   parseInt(metadataResult.Size) + 
                   (fileResult ? parseInt(fileResult.Size) : 0),
        cids,
        status: 'completed',
        timestamp: new Date().toISOString()
      };

      console.log('[Lighthouse] Complete storage workflow finished:', summary);

      return {
        didDocumentResult,
        metadataResult,
        fileResult,
        summary
      };
    } catch (error) {
      console.error('[Lighthouse] Complete storage workflow failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const lighthouseService = new LighthouseService();
