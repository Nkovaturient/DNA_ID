import axios, { AxiosInstance} from 'axios';
import { Dataset, DatasetMetadata, AppError } from '../types/interface';

export interface DataverseUploadResponse {
  status: string;
  data: {
    id: number;
    persistentId: string;
    protocol: string;
    authority: string;
    identifier: string;
    storageIdentifier: string;
  };
}

export interface DataverseFile {
  name: string;
  file: File | Buffer;
  description?: string;
  mimeType?: string;
  categories?: string[];
}

export class DataverseAPI {
  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.DATAVERSE_API_URL || 'https://demo.dataverse.org';
    this.apiKey = process.env.DATAVERSE_API_KEY || '';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'X-Dataverse-key': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[Dataverse API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const dataverseError: AppError = {
          message: error.response?.data?.message || error.message,
          status: error.response?.status || 500,
          details: error.response?.data,
          code: '',
          timestamp: new Date()
        };
        console.error('[Dataverse API Error]:', dataverseError);
        return Promise.reject(dataverseError);
      }
    );
  }

  /**
   * Test connection to Dataverse instance
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/info/version');
      console.log('[Dataverse] Connection successful:', response.data);
      return true;
    } catch (error) {
      console.error('[Dataverse] Connection failed:', error);
      return false;
    }
  }

  /**
   * Create a new dataset in Dataverse
   */
  async createDataset(
    dataverseName: string, 
    metadata: DatasetMetadata,
    files?: DataverseFile[]
  ): Promise<DataverseUploadResponse> {
    try {
      // Prepare dataset JSON according to Dataverse API
      const datasetJson = {
        datasetVersion: {
          metadataBlocks: {
            citation: {
              displayName: "Citation Metadata",
              fields: [
                {
                  typeName: "title",
                  multiple: false,
                  typeClass: "primitive",
                  value: metadata.title
                },
                {
                  typeName: "author",
                  multiple: true,
                  typeClass: "compound",
                  value: metadata.author,
                },
                {
                  typeName: "datasetContact",
                  multiple: true,
                  typeClass: "compound",
                  value: [{
                    datasetContactName: { typeName: "datasetContactName", value: metadata.author || "Anonymous" },
                    datasetContactAffiliation: { typeName: "datasetContactAffiliation", value: metadata.grantInformation || "" },
                    datasetContactEmail: { typeName: "datasetContactEmail", value: metadata.datasetContact || "contact@example.com" }
                  }]
                },
                {
                  typeName: "dsDescription",
                  multiple: true,
                  typeClass: "compound",
                  value: [{
                    dsDescriptionValue: { typeName: "dsDescriptionValue", value: metadata.description },
                    dsDescriptionDate: { typeName: "dsDescriptionDate", value: new Date().toISOString().split('T')[0] }
                  }]
                },
                {
                  typeName: "subject",
                  multiple: true,
                  typeClass: "controlledVocabulary",
                  value: metadata.subject || ["Other"]
                },
                {
                  typeName: "keyword",
                  multiple: true,
                  typeClass: "compound",
                  value: metadata.keyword
                },
                {
                  typeName: "depositor",
                  multiple: false,
                  typeClass: "primitive",
                  value: metadata.depositor || "DID System"
                },
                {
                  typeName: "dateOfDeposit",
                  multiple: false,
                  typeClass: "primitive",
                  value: new Date().toISOString().split('T')[0]
                }
              ]
            }
          }
        }
      };

      // Add custom metadata blocks for cultural heritage if needed
      if (metadata.culturalHeritage) {
        (datasetJson.datasetVersion.metadataBlocks as any).culturalHeritage = {
          displayName: "Cultural Heritage Metadata",
          fields: [
            {
              typeName: "culturalHeritageType",
              value: metadata.kindOfData || "Digital Collection"
            },
            {
              typeName: "culturalPeriod",
              value: metadata.timePeriodCovered|| "Contemporary"
            }
          ]
        };
      }

      // console.log('[Dataverse] Creating dataset with metadata:', JSON.stringify(datasetJson, null, 2));

      // Create the dataset
      const response = await this.client.post(
        `/api/dataverses/${dataverseName}/datasets`,
        datasetJson
      );

      console.log('[Dataverse] Dataset created successfully:', response.data);

      // Upload files if provided
      if (files && files.length > 0) {
        const persistentId = response.data.data.persistentId;
        await this.uploadFiles(persistentId, files);
      }

      return response.data;
    } catch (error) {
      console.error('[Dataverse] Dataset creation failed:', error);
      throw error;
    }
  }

  /**
   * Upload files to an existing dataset
   */
  async uploadFiles(persistentId: string, files: DataverseFile[]): Promise<void> {
    try {
      for (const file of files) {
        const formData = new FormData();
        
        // Add file
        if (file.file instanceof File) {
          formData.append('file', file.file, file.name);
        } else {
          // Handle Buffer for Node.js environments
          const blob = new Blob([file.file], { type: file.mimeType || 'application/octet-stream' });
          formData.append('file', blob, file.name);
        }

        // Add metadata
        const fileMetadata = {
          description: file.description || '',
          categories: file.categories || [],
          restrict: false
        };
        
        formData.append('jsonData', JSON.stringify(fileMetadata));

        await this.client.post(
          `/api/datasets/:persistentId/add?persistentId=${persistentId}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        console.log(`[Dataverse] File ${file.name} uploaded successfully`);
      }
    } catch (error) {
      console.error('[Dataverse] File upload failed:', error);
      throw error;
    }
  }

  /**
   * Get dataset by DOI or persistent ID
   */
  async getDataset(persistentId: string): Promise<Dataset> {
    try {
      const response = await this.client.get(
        `/api/datasets/:persistentId?persistentId=${persistentId}`
      );
      return response.data.data;
    } catch (error) {
      console.error('[Dataverse] Dataset fetch failed:', error);
      throw error;
    }
  }

  /**
   * Search datasets with enhanced filtering
   */
  async searchDatasets(
    query: string = '*',
    type: string = 'dataset',
    start: number = 0,
    perPage: number = 10,
    filters?: {
      subjects?: string[];
      culturalHeritage?: boolean;
      dateRange?: { start: string; end: string };
    }
  ): Promise<any> {
    try {
      let searchQuery = query;
      
      // Add filters to search query
      if (filters) {
        if (filters.subjects && filters.subjects.length > 0) {
          searchQuery += ` AND (${filters.subjects.map(s => `subject:"${s}"`).join(' OR ')})`;
        }
        if (filters.culturalHeritage) {
          searchQuery += ' AND (subject:"Cultural Heritage" OR keyword:"cultural heritage")';
        }
        if (filters.dateRange) {
          searchQuery += ` AND publicationDate:[${filters.dateRange.start} TO ${filters.dateRange.end}]`;
        }
      }

      const response = await this.client.get('/api/search', {
        params: {
          q: searchQuery,
          type,
          start,
          per_page: perPage,
          sort: 'date',
          order: 'desc'
        }
      });
      return response.data;
    } catch (error) {
      console.error('[Dataverse] Search failed:', error);
      throw error;
    }
  }

  /**
   * Get recent datasets from demo Dataverse
   */
  async getRecentDatasets(limit: number = 20): Promise<any> {
    try {
      const response = await this.searchDatasets('*', 'dataset', 0, limit);
      return response;
    } catch (error) {
      console.error('[Dataverse] Failed to fetch recent datasets:', error);
      throw error;
    }
  }

  /**
   * Get datasets by subject area
   */
  async getDatasetsBySubject(subject: string, limit: number = 10): Promise<any> {
    try {
      const response = await this.searchDatasets('*', 'dataset', 0, limit, {
        subjects: [subject]
      });
      return response;
    } catch (error) {
      console.error('[Dataverse] Failed to fetch datasets by subject:', error);
      throw error;
    }
  }

  /**
   * Get dataset metadata in different formats
   */
  async getDatasetMetadata(
    persistentId: string,
    format: 'json' | 'ddi' | 'oai_dc' | 'dcterms' = 'json'
  ): Promise<any> {
    try {
      const response = await this.client.get(
        `/api/datasets/:persistentId/versions/:latest?persistentId=${persistentId}`,
        {
          headers: {
            'Accept': format === 'json' ? 'application/json' : `application/${format}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('[Dataverse] Metadata fetch failed:', error);
      throw error;
    }
  }

  /**
   * Link DID to dataset (custom endpoint)
   */
  async linkDIDToDataset(persistentId: string, didId: string, cidHash: string): Promise<void> {
    try {
      // This would typically be a custom API endpoint you create
      // For now, we'll add it as metadata or use a custom field
      const linkMetadata = {
        didIdentifier: didId,
        contentAddressableId: cidHash,
        linkTimestamp: new Date().toISOString(),
        linkType: 'decentralized-identity'
      };

      // You might want to store this in your backend bridge service
      console.log('[Dataverse] Linking DID to dataset:', {
        persistentId,
        didId,
        cidHash,
        metadata: linkMetadata
      });

      // For production, implement actual linking logic
      // This could involve updating dataset metadata or using a separate linking service
    } catch (error) {
      console.error('[Dataverse] DID linking failed:', error);
      throw error;
    }
  }

  /**
   * Get dataset files
   */
  async getDatasetFiles(persistentId: string): Promise<any[]> {
    try {
      const response = await this.client.get(
        `/api/datasets/:persistentId/versions/:latest/files?persistentId=${persistentId}`
      );
      return response.data.data;
    } catch (error) {
      console.error('[Dataverse] Files fetch failed:', error);
      throw error;
    }
  }

  /**
   * Download file from dataset
   */
  async downloadFile(fileId: string): Promise<Blob> {
    try {
      const response = await this.client.get(
        `/api/access/datafile/${fileId}`,
        {
          responseType: 'blob'
        }
      );
      return response.data;
    } catch (error) {
      console.error('[Dataverse] File download failed:', error);
      throw error;
    }
  }

  /**
   * Publish dataset
   */
  async publishDataset(persistentId: string, type: 'major' | 'minor' = 'major'): Promise<void> {
    try {
      await this.client.post(
        `/api/datasets/:persistentId/actions/:publish?persistentId=${persistentId}&type=${type}`
      );
      console.log('[Dataverse] Dataset published successfully');
    } catch (error) {
      console.error('[Dataverse] Dataset publishing failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const dataverseAPI = new DataverseAPI();
