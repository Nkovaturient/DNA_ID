import axios, { AxiosInstance } from 'axios';
import { DID, Dataset, AppError } from '../types';

// Backend API configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface WorkflowResult {
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
  startTime: string;
  endTime?: string;
  duration?: number;
}

export interface BioAgentsAnalysisRequest {
  metadata: any;
  analysisType: 'harvest' | 'enrichment' | 'did-issuance' | 'full-workflow';
  options?: {
    culturalContext?: boolean;
    multilingualProcessing?: boolean;
    gdprCompliance?: boolean;
    sensitivityCheck?: boolean;
    qualityAssessment?: boolean;
    enrichmentOptions?: any;
    didOptions?: any;
  };
}

export interface BioAgentsAnalysisResult {
  success: boolean;
  data: any;
  metrics: {
    duration: number;
    stepsCompleted: number;
    totalSteps: number;
  };
  auditTrail: any[];
  error?: string;
}

export interface GDPRConsentRequest {
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
}

export interface GDPRComplianceCheck {
  compliant: boolean;
  score: number;
  issues: string[];
  recommendations: string[];
  personalDataDetected: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface LighthouseStorageResult {
  didDocumentCid: string;
  metadataCid: string;
  fileCid?: string;
  url: string;
  totalSize: number;
  allCids: string[];
}

export interface OriginTrailDKGResult {
  UAL: string;
  publicAssertionId: string;
  operation?: {
    operationId: string;
  };
}

export class BackendAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BACKEND_URL,
      timeout: 60000, // 60 seconds for complex operations
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[Backend API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const backendError: AppError = {
          message: error.response?.data?.message || error.message,
          status: error.response?.status || 500,
          details: error.response?.data,
          code: error.response?.data?.code || '',
          timestamp: new Date()
        };
        console.error('[Backend API Error]:', backendError);
        return Promise.reject(backendError);
      }
    );
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; timestamp: string; version: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }

  // DID Management
  async createDID(didData: {
    method: string;
    metadata: any;
    gdprConsent?: any;
    file?: any;
  }): Promise<DID> {
    const response = await this.client.post('/api/did/create', didData);
    return response.data;
  }

  async resolveDID(didId: string): Promise<DID | null> {
    const response = await this.client.get(`/resolve?did=${didId}`);
    return response.data;
  }

  async getDIDs(): Promise<DID[]> {
    const response = await this.client.get('/api/did/list');
    return response.data;
  }

  async revokeDID(didId: string): Promise<void> {
    await this.client.post(`/api/did/revoke`, { didId });
  }

  // Workflow Operations
  async executeCompleteWorkflow(workflowData: {
    didDocument: any;
    dataverseConfig?: any;
    metadata?: any;
    options?: any;
  }): Promise<WorkflowResult> {
    const response = await this.client.post('/api/workflow/complete-dna-id', workflowData);
    return response.data.workflow;
  }

  async executeBioAgentsPipeline(pipelineData: {
    datasetId?: string;
    doi?: string;
    persistentId?: string;
    options?: any;
  }): Promise<WorkflowResult> {
    const response = await this.client.post('/api/workflow/bioagents-pipeline', pipelineData);
    return response.data.workflow;
  }

  // BioAgents Analysis
  async analyzeWithBioAgents(request: BioAgentsAnalysisRequest): Promise<BioAgentsAnalysisResult> {
    const response = await this.client.post('/api/bioagents/analyze', request);
    return response.data;
  }

  async executeBioAgentsWorkflow(workflowName: string, input: any): Promise<BioAgentsAnalysisResult> {
    const response = await this.client.post('/api/bioagents/workflow', {
      workflowName,
      input
    });
    return response.data;
  }

  // Dataverse Integration
  async searchDataverse(query: string, options?: any): Promise<any> {
    const response = await this.client.get('/api/dataverse/search', {
      params: { query, ...options }
    });
    return response.data;
  }

  async getDataverseDataset(persistentId: string): Promise<Dataset> {
    const response = await this.client.get(`/api/dataverse/dataset/${persistentId}`);
    return response.data;
  }

  async createDataverseDataset(datasetData: any): Promise<any> {
    const response = await this.client.post('/api/dataverse/create', datasetData);
    return response.data;
  }

  async linkDIDToDataverse(datasetId: string, didId: string): Promise<void> {
    await this.client.post('/api/dataverse/link-did', { datasetId, didId });
  }

  // GDPR Operations
  async checkGDPRCompliance(checkData: {
    hasConsent: boolean;
    purposes: string[];
    dataCategories: string[];
    lawfulBasis: string;
    retentionPeriod: string;
  }): Promise<GDPRComplianceCheck> {
    const response = await this.client.post('/api/gdpr/check-compliance', checkData);
    return response.data;
  }

  async recordGDPRConsent(consentData: GDPRConsentRequest): Promise<any> {
    const response = await this.client.post('/api/gdpr/record-consent', consentData);
    return response.data;
  }

  async requestDataDeletion(didId: string, userConsent: boolean): Promise<void> {
    await this.client.post('/api/gdpr/request-deletion', { didId, userConsent });
  }

  async exportUserData(didId: string): Promise<any> {
    const response = await this.client.get(`/api/gdpr/export-data/${didId}`);
    return response.data;
  }

  // Lighthouse Storage
  async storeOnLighthouse(data: any, options?: any): Promise<LighthouseStorageResult> {
    const response = await this.client.post('/api/lighthouse/store', { data, options });
    return response.data;
  }

  async retrieveFromLighthouse(cid: string): Promise<any> {
    const response = await this.client.get(`/api/lighthouse/retrieve/${cid}`);
    return response.data;
  }

  // OriginTrail DKG
  async publishToOriginTrail(assetData: any, options?: any): Promise<OriginTrailDKGResult> {
    const response = await this.client.post('/api/origintrail/publish', { assetData, options });
    return response.data;
  }

  async queryOriginTrail(query: string): Promise<any> {
    const response = await this.client.post('/api/origintrail/query', { query });
    return response.data;
  }

  async getOriginTrailNetworkStats(): Promise<any> {
    const response = await this.client.get('/api/origintrail/network-stats');
    return response.data;
  }

  // Metadata Management
  async enrichMetadata(metadata: any, options?: any): Promise<any> {
    const response = await this.client.post('/api/metadata/enrich', { metadata, options });
    return response.data;
  }

  async validateMetadata(metadata: any): Promise<any> {
    const response = await this.client.post('/api/metadata/validate', { metadata });
    return response.data;
  }

  // Storage Operations (Powergate)
  async uploadToStorage(data: any, config?: any): Promise<{ cid: string; jobId?: string }> {
    const response = await this.client.post('/api/storage/upload', { data, config });
    return response.data;
  }

  async retrieveFromStorage(cid: string): Promise<any> {
    const response = await this.client.get(`/api/storage/retrieve/${cid}`);
    return response.data;
  }

  // System Health and Status
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    services: any;
    version: string;
  }> {
    const response = await this.client.get('/api/system/health');
    return response.data;
  }

  async testAllConnections(): Promise<{
    lighthouse: { status: string; details?: any };
    originTrail: { status: string; details?: any };
    gdpr: { status: string; details?: any };
    bioAgents: { status: string; details?: any };
    dataverse: { status: string; details?: any };
    overall: 'healthy' | 'degraded' | 'unhealthy';
  }> {
    const response = await this.client.get('/api/system/test-connections');
    return response.data;
  }
}

// Export singleton instance
export const backendAPI = new BackendAPI(); 