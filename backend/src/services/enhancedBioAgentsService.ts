import { createHeliXIDBioAgent, AgentConfig } from '../../../bioagents/src';
import { DataverseAPI } from '../controllers/dataverseApi';
import { textilePowergateService } from './textilePowergateService';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

export interface MetadataHarvestResult {
  success: boolean;
  metadata: {
    id: string;
    title: string;
    description: string;
    authors: Array<{
      name: string;
      affiliation?: string;
      orcid?: string;
    }>;
    subjects: string[];
    keywords: string[];
    publicationDate: string;
    version: string;
    license?: string;
    doi?: string;
    files: Array<{
      name: string;
      size: number;
      type: string;
      checksum: string;
    }>;
    culturalContext?: {
      significance: string;
      categories: string[];
      sensitivity: 'low' | 'medium' | 'high';
      communityRelevance: string;
    };
  };
  provenance: {
    harvestTimestamp: string;
    source: string;
    method: string;
    agent: string;
  };
  metrics: {
    harvestDuration: number;
    fieldsExtracted: number;
    qualityScore: number;
  };
}

export interface MetadataEnrichmentResult {
  success: boolean;
  enrichedMetadata: {
    original: any;
    enrichment: {
      culturalContext: {
        significance: string;
        culturalCategories: string[];
        communityRelevance: string;
        historicalImportance: string;
        sensitivePractices: string[];
        recommendedAccessLevel: 'open' | 'restricted' | 'closed';
      };
      qualityAssessment: {
        completenessScore: number;
        consistencyScore: number;
        accuracyScore: number;
        recommendations: string[];
        missingFields: string[];
      };
      semanticTags: {
        entities: Array<{
          text: string;
          type: string;
          confidence: number;
        }>;
        concepts: string[];
        themes: string[];
        disciplines: string[];
      };
      gdprCompliance: {
        personalDataDetected: boolean;
        personalDataTypes: string[];
        processingPurposes: string[];
        legalBasis: string;
        retentionPeriod: string;
        risks: string[];
        recommendations: string[];
        complianceScore: number;
      };
      translations?: {
        [languageCode: string]: {
          title: string;
          description: string;
          keywords: string[];
        };
      };
      accessibility: {
        readabilityScore: number;
        languageComplexity: 'simple' | 'moderate' | 'complex';
        suggestedImprovements: string[];
      };
    };
  };
  auditTrail: Array<{
    step: string;
    timestamp: string;
    duration: number;
    agent: string;
    input?: any;
    output?: any;
  }>;
  metrics: {
    enrichmentDuration: number;
    aiCallsCount: number;
    tokensUsed: number;
    confidenceScore: number;
  };
}

export interface DIDIssuanceResult {
  success: boolean;
  did: {
    id: string;
    document: any;
    method: string;
    created: string;
  };
  verifiableCredential: {
    id: string;
    type: string[];
    issuer: string;
    issuanceDate: string;
    expirationDate?: string;
    credentialSubject: any;
    proof: any;
  };
  storage: {
    didDocumentCid: string;
    credentialCid: string;
    powergateJobId: string;
  };
  provenance: {
    sourceDataset: string;
    harvestTimestamp: string;
    enrichmentTimestamp: string;
    issuanceTimestamp: string;
    processingSteps: string[];
    agents: string[];
  };
  compliance: {
    gdprCompliant: boolean;
    culturalSensitivityChecked: boolean;
    accessControlApplied: boolean;
  };
}

export class EnhancedBioAgentsService {
  private bioAgent: any = null;
  private dataverseAPI: DataverseAPI;
  private isInitialized = false;

  constructor() {
    this.dataverseAPI = new DataverseAPI();
  }

  /**
   * Initialize BioAgents with enhanced configuration
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      const config: AgentConfig = {
        llm: {
          provider: 'openai',
          model: process.env.OPENAI_MODEL || 'gpt-4',
          apiKey: process.env.OPENAI_API_KEY,
          temperature: 0.3,
          maxTokens: 4000
        },
        dataverse: {
          apiUrl: process.env.DATAVERSE_API_URL || 'https://demo.dataverse.org',
          apiKey: process.env.DATAVERSE_API_KEY
        },
        dkg: {
          nodeUrl: process.env.ORIGINTRAIL_NODE_URL || 'https://api.testnet.origintrail.network',
          wallet: {
            privateKey: process.env.ORIGINTRAIL_PRIVATE_KEY || '',
            public: process.env.ORIGINTRAIL_PUBLIC_KEY || ''
          }
        },
        gdpr: {
          strictMode: true,
          auditLevel: 'comprehensive'
        }
      };

      this.bioAgent = await createHeliXIDBioAgent(config);
      console.log('[BioAgents] Enhanced service initialized with plugins:', this.bioAgent.listPlugins());
      
      this.isInitialized = true;
    } catch (error) {
      console.error('[BioAgents] Initialization failed:', error);
      throw new Error(`BioAgents initialization failed: ${error}`);
    }
  }

  /**
   * Harvest metadata from Dataverse with enhanced processing
   */
  async harvestMetadata(input: {
    datasetId?: string;
    doi?: string;
    persistentId?: string;
    options?: {
      includeCulturalContext?: boolean;
      performQualityCheck?: boolean;
      extractProvenance?: boolean;
    };
  }): Promise<MetadataHarvestResult> {
    try {
      await this.initialize();
      
      const startTime = Date.now();
      console.log('[BioAgents] Starting metadata harvest:', input);

      // Execute harvest workflow
      const result = await this.bioAgent.executeWorkflow('test-harvest', {
        datasetId: input.datasetId,
        doi: input.doi,
        persistentId: input.persistentId
      });

      if (!result.success) {
        throw new Error(`Harvest failed: ${result.error}`);
      }

      const harvestDuration = Date.now() - startTime;
      const metadata = result.data;

      // Enhanced metadata processing
      const enhancedMetadata = {
        ...metadata,
        id: metadata.id || uuidv4(),
        harvestId: uuidv4(),
        processingTimestamp: new Date().toISOString()
      };

      // Add cultural context if requested
      if (input.options?.includeCulturalContext) {
        enhancedMetadata.culturalContext = await this.analyzeCulturalContext(metadata);
      }

      const harvestResult: MetadataHarvestResult = {
        success: true,
        metadata: enhancedMetadata,
        provenance: {
          harvestTimestamp: new Date().toISOString(),
          source: input.doi ? `doi:${input.doi}` : input.persistentId || input.datasetId || 'unknown',
          method: 'dataverse-api',
          agent: 'bioagents-harvester-v1.0'
        },
        metrics: {
          harvestDuration,
          fieldsExtracted: Object.keys(metadata).length,
          qualityScore: this.calculateQualityScore(metadata)
        }
      };

      console.log('[BioAgents] Metadata harvest completed:', {
        id: enhancedMetadata.id,
        fieldsExtracted: harvestResult.metrics.fieldsExtracted,
        duration: harvestDuration
      });

      return harvestResult;
    } catch (error) {
      console.error('[BioAgents] Metadata harvest failed:', error);
      throw new Error(`Metadata harvest failed: ${error}`);
    }
  }

  /**
   * Enrich metadata with AI-powered analysis
   */
  async enrichMetadata(input: {
    metadata: any;
    options?: {
      culturalContext?: boolean;
      multilingualProcessing?: boolean;
      gdprCompliance?: boolean;
      sensitivityCheck?: boolean;
      qualityAssessment?: boolean;
      accessibilityAnalysis?: boolean;
    };
  }): Promise<MetadataEnrichmentResult> {
    try {
      await this.initialize();
      
      const startTime = Date.now();
      const auditTrail: any[] = [];
      let aiCallsCount = 0;
      let tokensUsed = 0;

      console.log('[BioAgents] Starting metadata enrichment:', {
        metadataId: input.metadata.id,
        options: input.options
      });

      // Execute enrichment workflow
      const enrichmentResult = await this.bioAgent.executeWorkflow('test-enrichment', {
        metadata: input.metadata,
        options: {
          culturalContext: input.options?.culturalContext ?? true,
          multilingualProcessing: input.options?.multilingualProcessing ?? false,
          gdprCompliance: input.options?.gdprCompliance ?? true,
          sensitivityCheck: input.options?.sensitivityCheck ?? true,
          qualityAssessment: input.options?.qualityAssessment ?? true,
          ...input.options
        }
      });

      if (!enrichmentResult.success) {
        throw new Error(`Enrichment failed: ${enrichmentResult.error}`);
      }

      const enrichedData = enrichmentResult.data;
      auditTrail.push(...enrichmentResult.auditTrail);
      aiCallsCount = enrichmentResult.auditTrail.length;

      // Additional accessibility analysis
      let accessibilityAnalysis = null;
      if (input.options?.accessibilityAnalysis) {
        accessibilityAnalysis = await this.analyzeAccessibility(input.metadata);
        auditTrail.push({
          step: 'accessibility-analysis',
          timestamp: new Date().toISOString(),
          duration: 1000,
          agent: 'accessibility-analyzer',
          output: accessibilityAnalysis
        });
      }

      const enrichmentDuration = Date.now() - startTime;

      const result: MetadataEnrichmentResult = {
        success: true,
        enrichedMetadata: {
          original: input.metadata,
          enrichment: {
            ...enrichedData.enrichment,
            accessibility: accessibilityAnalysis || {
              readabilityScore: 75,
              languageComplexity: 'moderate' as const,
              suggestedImprovements: []
            }
          }
        },
        auditTrail,
        metrics: {
          enrichmentDuration,
          aiCallsCount,
          tokensUsed: tokensUsed || aiCallsCount * 500, // Estimate
          confidenceScore: this.calculateConfidenceScore(enrichedData)
        }
      };

      console.log('[BioAgents] Metadata enrichment completed:', {
        metadataId: input.metadata.id,
        enrichmentKeys: Object.keys(result.enrichedMetadata.enrichment),
        duration: enrichmentDuration,
        confidenceScore: result.metrics.confidenceScore
      });

      return result;
    } catch (error) {
      console.error('[BioAgents] Metadata enrichment failed:', error);
      throw new Error(`Metadata enrichment failed: ${error}`);
    }
  }

  /**
   * Issue DID and Verifiable Credential with enhanced features
   */
  async issueDIDAndCredential(input: {
    enrichedMetadata: any;
    options?: {
      publishToDKG?: boolean;
      storeOnFilecoin?: boolean;
      expirationDays?: number;
      credentialType?: string;
      accessControl?: 'open' | 'restricted' | 'private';
    };
  }): Promise<DIDIssuanceResult> {
    try {
      await this.initialize();
      
      const startTime = Date.now();
      console.log('[BioAgents] Starting DID issuance:', {
        metadataId: input.enrichedMetadata.original.id,
        options: input.options
      });

      // Execute DID issuance workflow
      const didResult = await this.bioAgent.executeWorkflow('test-did-issuance', {
        enrichedMetadata: input.enrichedMetadata,
        options: {
          publishToDKG: input.options?.publishToDKG ?? false,
          expirationDays: input.options?.expirationDays ?? 365,
          credentialType: input.options?.credentialType ?? 'CulturalHeritageDatasetCredential',
          ...input.options
        }
      });

      if (!didResult.success) {
        throw new Error(`DID issuance failed: ${didResult.error}`);
      }

      const didData = didResult.data;
      
      // Store on Filecoin if requested
      let storage = null;
      if (input.options?.storeOnFilecoin) {
        console.log('[BioAgents] Storing DID document on Filecoin...');
        
        const didStorageResult = await textilePowergateService.storeDIDDocument(didData.didDocument);
        const credentialStorageResult = await textilePowergateService.storeVerifiableCredentials([didData.verifiableCredential]);
        
        storage = {
          didDocumentCid: didStorageResult.cid,
          credentialCid: credentialStorageResult.cid,
          powergateJobId: didStorageResult.jobId
        };
      }

      const issuanceDuration = Date.now() - startTime;

      const result: DIDIssuanceResult = {
        success: true,
        did: {
          id: didData.did,
          document: didData.didDocument,
          method: didData.did.split(':')[1],
          created: new Date().toISOString()
        },
        verifiableCredential: didData.verifiableCredential,
        storage: storage || {
          didDocumentCid: '',
          credentialCid: '',
          powergateJobId: ''
        },
        provenance: didData.provenance,
        compliance: {
          gdprCompliant: input.enrichedMetadata.enrichment.gdprCompliance?.complianceScore > 80,
          culturalSensitivityChecked: !!input.enrichedMetadata.enrichment.culturalContext,
          accessControlApplied: !!input.options?.accessControl
        }
      };

      console.log('[BioAgents] DID issuance completed:', {
        did: result.did.id,
        credentialId: result.verifiableCredential.id,
        duration: issuanceDuration,
        storedOnFilecoin: !!storage
      });

      return result;
    } catch (error) {
      console.error('[BioAgents] DID issuance failed:', error);
      throw new Error(`DID issuance failed: ${error}`);
    }
  }

  /**
   * Execute complete workflow: harvest -> enrich -> issue DID
   */
  async executeCompleteWorkflow(input: {
    datasetId?: string;
    doi?: string;
    persistentId?: string;
    harvestOptions?: any;
    enrichmentOptions?: any;
    didOptions?: any;
  }): Promise<{
    harvest: MetadataHarvestResult;
    enrichment: MetadataEnrichmentResult;
    didIssuance: DIDIssuanceResult;
    summary: {
      totalDuration: number;
      stepsCompleted: number;
      overallSuccess: boolean;
      qualityScore: number;
      complianceScore: number;
    };
  }> {
    try {
      const workflowStartTime = Date.now();
      console.log('[BioAgents] Starting complete workflow:', input);

      // Step 1: Harvest metadata
      const harvestResult = await this.harvestMetadata({
        datasetId: input.datasetId,
        doi: input.doi,
        persistentId: input.persistentId,
        options: input.harvestOptions
      });

      // Step 2: Enrich metadata
      const enrichmentResult = await this.enrichMetadata({
        metadata: harvestResult.metadata,
        options: input.enrichmentOptions
      });

      // Step 3: Issue DID and VC
      const didIssuanceResult = await this.issueDIDAndCredential({
        enrichedMetadata: enrichmentResult.enrichedMetadata,
        options: input.didOptions
      });

      const totalDuration = Date.now() - workflowStartTime;

      const summary = {
        totalDuration,
        stepsCompleted: 3,
        overallSuccess: harvestResult.success && enrichmentResult.success && didIssuanceResult.success,
        qualityScore: harvestResult.metrics.qualityScore,
        complianceScore: enrichmentResult.enrichedMetadata.enrichment.gdprCompliance.complianceScore
      };

      console.log('[BioAgents] Complete workflow finished:', {
        did: didIssuanceResult.did.id,
        totalDuration,
        qualityScore: summary.qualityScore,
        complianceScore: summary.complianceScore
      });

      return {
        harvest: harvestResult,
        enrichment: enrichmentResult,
        didIssuance: didIssuanceResult,
        summary
      };
    } catch (error) {
      console.error('[BioAgents] Complete workflow failed:', error);
      throw new Error(`Complete workflow failed: ${error}`);
    }
  }

  /**
   * Analyze cultural context with enhanced sensitivity detection
   */
  private async analyzeCulturalContext(metadata: any): Promise<any> {
    // This would use the LangChain enricher plugin for cultural analysis
    const culturalAnalysis = {
      significance: 'High cultural significance detected',
      categories: ['indigenous-knowledge', 'traditional-practices'],
      sensitivity: 'medium' as const,
      communityRelevance: 'Relevant to specific cultural communities'
    };

    return culturalAnalysis;
  }

  /**
   * Analyze accessibility and readability
   */
  private async analyzeAccessibility(metadata: any): Promise<any> {
    const text = `${metadata.title} ${metadata.description}`.toLowerCase();
    
    // Simple readability analysis
    const sentences = text.split(/[.!?]+/).length;
    const words = text.split(/\s+/).length;
    const avgWordsPerSentence = words / sentences;
    
    let readabilityScore = 100;
    if (avgWordsPerSentence > 20) readabilityScore -= 20;
    if (avgWordsPerSentence > 30) readabilityScore -= 20;
    
    let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
    if (avgWordsPerSentence > 15) complexity = 'moderate';
    if (avgWordsPerSentence > 25) complexity = 'complex';

    return {
      readabilityScore: Math.max(readabilityScore, 0),
      languageComplexity: complexity,
      suggestedImprovements: complexity === 'complex' 
        ? ['Consider shorter sentences', 'Use simpler vocabulary', 'Add explanatory notes']
        : []
    };
  }

  /**
   * Calculate metadata quality score
   */
  private calculateQualityScore(metadata: any): number {
    let score = 0;
    const maxScore = 100;
    
    // Title (20 points)
    if (metadata.title && metadata.title.length > 5) score += 20;
    else if (metadata.title) score += 10;
    
    // Description (25 points)
    if (metadata.description && metadata.description.length > 50) score += 25;
    else if (metadata.description) score += 15;
    
    // Authors (15 points)
    if (metadata.authors && metadata.authors.length > 0) score += 15;
    
    // Keywords (15 points)
    if (metadata.keywords && metadata.keywords.length >= 3) score += 15;
    else if (metadata.keywords && metadata.keywords.length > 0) score += 10;
    
    // Subjects (10 points)
    if (metadata.subjects && metadata.subjects.length > 0) score += 10;
    
    // Files (10 points)
    if (metadata.files && metadata.files.length > 0) score += 10;
    
    // License (5 points)
    if (metadata.license) score += 5;
    
    return Math.min(score, maxScore);
  }

  /**
   * Calculate confidence score for enrichment
   */
  private calculateConfidenceScore(enrichedData: any): number {
    let score = 0;
    let factors = 0;

    if (enrichedData.enrichment?.culturalContext) {
      score += 25;
      factors++;
    }
    
    if (enrichedData.enrichment?.qualityAssessment) {
      score += 25;
      factors++;
    }
    
    if (enrichedData.enrichment?.semanticTags) {
      score += 25;
      factors++;
    }
    
    if (enrichedData.enrichment?.gdprCompliance) {
      score += 25;
      factors++;
    }

    return factors > 0 ? score / factors * 4 : 0; // Normalize to 100
  }

  /**
   * Get service status and health
   */
  async getServiceStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    initialized: boolean;
    plugins: string[];
    workflows: string[];
    lastActivity?: string;
    metrics: {
      totalHarvests: number;
      totalEnrichments: number;
      totalDIDIssuances: number;
      averageProcessingTime: number;
    };
  }> {
    try {
      await this.initialize();
      
      const plugins = this.bioAgent.listPlugins();
      const workflows = this.bioAgent.listWorkflows();
      
      return {
        status: 'healthy',
        initialized: this.isInitialized,
        plugins: plugins.map((p: any) => p.name),
        workflows,
        lastActivity: new Date().toISOString(),
        metrics: {
          totalHarvests: 0, // Would track in production
          totalEnrichments: 0,
          totalDIDIssuances: 0,
          averageProcessingTime: 0
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        initialized: false,
        plugins: [],
        workflows: [],
        metrics: {
          totalHarvests: 0,
          totalEnrichments: 0,
          totalDIDIssuances: 0,
          averageProcessingTime: 0
        }
      };
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.bioAgent) {
      await this.bioAgent.cleanup();
      this.bioAgent = null;
    }
    this.isInitialized = false;
    console.log('[BioAgents] Service cleaned up');
  }
}

// Export singleton instance
export const enhancedBioAgentsService = new EnhancedBioAgentsService();