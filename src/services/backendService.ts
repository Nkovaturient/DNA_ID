import { backendAPI } from '../api/backendApi';
import { DID, Dataset, DatasetMetadata} from '../types';

export interface WorkflowExecutionResult {
  success: boolean;
  workflowId: string;
  status: 'in_progress' | 'completed' | 'failed';
  steps: Array<{
    step: string;
    status: 'completed' | 'failed' | 'pending';
    result?: any;
    timestamp: string;
  }>;
  summary?: {
    totalSteps: number;
    completedSteps: number;
    lighthouseCid?: string;
    originTrailUal?: string;
    provenanceUal?: string;
    gdprCompliant: boolean;
    culturalHeritage: boolean;
  };
  error?: string;
  duration?: number;
}

export interface DIDCreationRequest {
  method: 'flow' | 'near';
  metadata: {
    name: string;
    description: string;
    type: 'dataset' | 'researcher' | 'institution';
    tags: string[];
    culturalHeritage?: boolean;
    author?: string;
    institution?: string;
    contactEmail?: string;
  };
  gdprConsent: {
    granted: boolean;
    purposes: string[];
    lawfulBasis: 'consent' | 'legitimate_interests';
  };
  file?: {
    name: string;
    data: string; // base64 encoded
    size: number;
    type: string;
  };
}

export class BackendService {
  /**
   * Health check for backend connectivity
   */
  async healthCheck() {
    return await backendAPI.healthCheck();
  }

  /**
   * Create a new DID with full workflow processing
   */
  async createDID(request: DIDCreationRequest): Promise<DID> {
    return await backendAPI.createDID(request);
  }

  /**
   * Resolve a DID to get its document and metadata
   */
  async resolveDID(didId: string): Promise<DID | null> {
    return await backendAPI.resolveDID(didId);
  }

  /**
   * Execute complete DNA_ID workflow
   */
  async executeCompleteWorkflow(workflowData: {
    didDocument: any;
    dataverseConfig?: any;
    metadata?: any;
    options?: any;
  }): Promise<WorkflowExecutionResult> {
    const result = await backendAPI.executeCompleteWorkflow(workflowData);
    return {
      ...result,
      success: true
    };
  }

  /**
   * Execute BioAgents pipeline for dataset processing
   */
  async executeBioAgentsPipeline(pipelineData: {
    datasetId?: string;
    doi?: string;
    persistentId?: string;
    options?: any;
  }): Promise<WorkflowExecutionResult> {
    const result = await backendAPI.executeBioAgentsPipeline(pipelineData);
    return {
      ...result,
      success: true
    };
  }

  /**
   * Analyze data with BioAgents
   */
  async analyzeWithBioAgents(request: {
    metadata: any;
    analysisType: 'harvest' | 'enrichment' | 'did-issuance' | 'full-workflow';
    options?: any;
  }) {
    return await backendAPI.analyzeWithBioAgents(request);
  }

  /**
   * Search Dataverse datasets
   */
  async searchDataverse(query: string, options?: any) {
    return await backendAPI.searchDataverse(query, options);
  }

  /**
   * Get specific dataset from Dataverse
   */
  async getDataverseDataset(persistentId: string): Promise<Dataset> {
    return await backendAPI.getDataverseDataset(persistentId);
  }

  /**
   * Create dataset in Dataverse
   */
  async createDataverseDataset(datasetData: any) {
    return await backendAPI.createDataverseDataset(datasetData);
  }

  /**
   * Link DID to Dataverse dataset
   */
  async linkDIDToDataverse(datasetId: string, didId: string): Promise<void> {
    return await backendAPI.linkDIDToDataverse(datasetId, didId);
  }

  /**
   * Check GDPR compliance
   */
  async checkGDPRCompliance(checkData: {
    hasConsent: boolean;
    purposes: string[];
    dataCategories: string[];
    lawfulBasis: string;
    retentionPeriod: string;
  }) {
    return await backendAPI.checkGDPRCompliance(checkData);
  }

  /**
   * Record GDPR consent
   */
  async recordGDPRConsent(consentData: {
    granted: boolean;
    purposes: string[];
    lawfulBasis: 'consent' | 'legitimate_interests';
    dataSubject: {
      id: string;
      email: string;
    };
    dataCategories: string[];
    processingActivities: string[];
    retentionPeriod: string;
    withdrawable: boolean;
  }) {
    return await backendAPI.recordGDPRConsent(consentData);
  }

  /**
   * Request data deletion (GDPR right to be forgotten)
   */
  async requestDataDeletion(didId: string, userConsent: boolean): Promise<void> {
    return await backendAPI.requestDataDeletion(didId, userConsent);
  }

  /**
   * Export user data (GDPR right to data portability)
   */
  async exportUserData(didId: string) {
    return await backendAPI.exportUserData(didId);
  }

  /**
   * Store data on Lighthouse (Filecoin)
   */
  async storeOnLighthouse(data: any, options?: any) {
    return await backendAPI.storeOnLighthouse(data, options);
  }

  /**
   * Retrieve data from Lighthouse
   */
  async retrieveFromLighthouse(cid: string) {
    return await backendAPI.retrieveFromLighthouse(cid);
  }

  /**
   * Publish to OriginTrail DKG
   */
  async publishToOriginTrail(assetData: any, options?: any) {
    return await backendAPI.publishToOriginTrail(assetData, options);
  }

  /**
   * Query OriginTrail DKG
   */
  async queryOriginTrail(query: string) {
    return await backendAPI.queryOriginTrail(query);
  }

  /**
   * Get OriginTrail network statistics
   */
  async getOriginTrailNetworkStats() {
    return await backendAPI.getOriginTrailNetworkStats();
  }

  /**
   * Enrich metadata using AI/ML
   */
  async enrichMetadata(metadata: any, options?: any) {
    return await backendAPI.enrichMetadata(metadata, options);
  }

  /**
   * Validate metadata
   */
  async validateMetadata(metadata: any) {
    return await backendAPI.validateMetadata(metadata);
  }

  /**
   * Upload to storage (Powergate/Filecoin)
   */
  async uploadToStorage(data: any, config?: any) {
    return await backendAPI.uploadToStorage(data, config);
  }

  /**
   * Retrieve from storage
   */
  async retrieveFromStorage(cid: string) {
    return await backendAPI.retrieveFromStorage(cid);
  }

  /**
   * Get system health status
   */
  async getSystemHealth() {
    return await backendAPI.getSystemHealth();
  }

  /**
   * Test all service connections
   */
  async testAllConnections() {
    return await backendAPI.testAllConnections();
  }

  /**
   * Create a complete DNA_ID workflow from scratch
   */
  async createCompleteDNAID(metadata: DatasetMetadata, options?: {
    culturalHeritage?: boolean;
    gdprConsent?: boolean;
    publishToDataverse?: boolean;
    enrichWithBioAgents?: boolean;
    storeOnFilecoin?: boolean;
    publishToOriginTrail?: boolean;
  }): Promise<{
    did: DID;
    workflow: WorkflowExecutionResult;
    dataverseDataset?: Dataset;
  }> {
    try {
      // Step 1: Create DID with metadata
      const didRequest: DIDCreationRequest = {
        method: 'flow',
        metadata: {
          name: metadata.title,
          description: metadata.description,
          type: 'dataset',
          tags: metadata.subject || [],
          culturalHeritage: options?.culturalHeritage || false,
          author: metadata.author?.[0]?.authorName || 'Unknown Author',
          institution: metadata.author?.[0]?.authorAffiliation || 'Unknown Institution',
          contactEmail: metadata.datasetContact?.[0]?.datasetContactEmail || 'contact@example.com'
        },
        gdprConsent: {
          granted: options?.gdprConsent || false,
          purposes: ['did_creation', 'metadata_enrichment', 'storage', 'publication'],
          lawfulBasis: options?.gdprConsent ? 'consent' : 'legitimate_interests'
        }
      };

      const did = await this.createDID(didRequest);

      // Step 2: Execute complete workflow
      const workflow = await this.executeCompleteWorkflow({
        didDocument: did,
        metadata: {
          ...metadata,
          didId: did.id,
          culturalHeritage: options?.culturalHeritage || false
        },
        options: {
          publishToDataverse: options?.publishToDataverse || false,
          enrichWithBioAgents: options?.enrichWithBioAgents || true,
          storeOnFilecoin: options?.storeOnFilecoin || true,
          publishToOriginTrail: options?.publishToOriginTrail || true
        }
      });

      // Step 3: Create Dataverse dataset if requested
      let dataverseDataset: Dataset | undefined;
      if (options?.publishToDataverse) {
        try {
          dataverseDataset = await this.createDataverseDataset({
            ...metadata,
            didId: did.id
          });
        } catch (error) {
          console.warn('Failed to create Dataverse dataset:', error);
        }
      }

      return {
        did,
        workflow,
        dataverseDataset
      };

    } catch (error) {
      console.error('Failed to create complete DNA_ID:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const backendService = new BackendService(); 