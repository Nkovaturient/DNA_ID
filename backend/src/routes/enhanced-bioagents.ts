import express, { Request, Response } from 'express';
import { enhancedBioAgentsService } from '../services/enhancedBioAgentsService';

const router = express.Router();

/**
 * POST /api/enhanced-bioagents/harvest
 * Enhanced metadata harvesting with cultural context analysis
 */
router.post('/harvest', async (req: Request, res: Response) => {
  try {
    const { 
      datasetId, 
      doi, 
      persistentId, 
      options = {} 
    } = req.body;

    if (!datasetId && !doi && !persistentId) {
      return res.status(400).json({
        error: 'Dataset identifier required',
        message: 'Provide datasetId, doi, or persistentId',
        code: 'MISSING_DATASET_IDENTIFIER'
      });
    }

    const result = await enhancedBioAgentsService.harvestMetadata({
      datasetId,
      doi,
      persistentId,
      options: {
        includeCulturalContext: options.includeCulturalContext ?? true,
        performQualityCheck: options.performQualityCheck ?? true,
        extractProvenance: options.extractProvenance ?? true,
        ...options
      }
    });

    res.json({
      success: result.success,
      harvest: result,
      message: 'Metadata harvested successfully with enhanced processing',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Enhanced BioAgents] Harvest failed:', error);
    res.status(500).json({
      error: 'Metadata harvest failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/enhanced-bioagents/enrich
 * AI-powered metadata enrichment with cultural sensitivity
 */
router.post('/enrich', async (req: Request, res: Response) => {
  try {
    const { metadata, options = {} } = req.body;

    if (!metadata) {
      return res.status(400).json({
        error: 'Metadata is required',
        code: 'MISSING_METADATA'
      });
    }

    const result = await enhancedBioAgentsService.enrichMetadata({
      metadata,
      options: {
        culturalContext: options.culturalContext ?? true,
        multilingualProcessing: options.multilingualProcessing ?? false,
        gdprCompliance: options.gdprCompliance ?? true,
        sensitivityCheck: options.sensitivityCheck ?? true,
        qualityAssessment: options.qualityAssessment ?? true,
        accessibilityAnalysis: options.accessibilityAnalysis ?? true,
        ...options
      }
    });

    res.json({
      success: result.success,
      enrichment: result,
      message: 'Metadata enriched successfully with AI analysis',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Enhanced BioAgents] Enrichment failed:', error);
    res.status(500).json({
      error: 'Metadata enrichment failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/enhanced-bioagents/issue-did
 * Issue DID and Verifiable Credential with enhanced features
 */
router.post('/issue-did', async (req: Request, res: Response) => {
  try {
    const { enrichedMetadata, options = {} } = req.body;

    if (!enrichedMetadata) {
      return res.status(400).json({
        error: 'Enriched metadata is required',
        code: 'MISSING_ENRICHED_METADATA'
      });
    }

    const result = await enhancedBioAgentsService.issueDIDAndCredential({
      enrichedMetadata,
      options: {
        publishToDKG: options.publishToDKG ?? false,
        storeOnFilecoin: options.storeOnFilecoin ?? true,
        expirationDays: options.expirationDays ?? 365,
        credentialType: options.credentialType ?? 'CulturalHeritageDatasetCredential',
        accessControl: options.accessControl ?? 'open',
        ...options
      }
    });

    res.json({
      success: result.success,
      didIssuance: result,
      message: 'DID and Verifiable Credential issued successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Enhanced BioAgents] DID issuance failed:', error);
    res.status(500).json({
      error: 'DID issuance failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/enhanced-bioagents/complete-pipeline
 * Execute complete BioAgents pipeline with all enhancements
 */
router.post('/complete-pipeline', async (req: Request, res: Response) => {
  try {
    const {
      datasetId,
      doi,
      persistentId,
      harvestOptions = {},
      enrichmentOptions = {},
      didOptions = {}
    } = req.body;

    if (!datasetId && !doi && !persistentId) {
      return res.status(400).json({
        error: 'Dataset identifier required',
        message: 'Provide datasetId, doi, or persistentId',
        code: 'MISSING_DATASET_IDENTIFIER'
      });
    }

    const result = await enhancedBioAgentsService.executeCompleteWorkflow({
      datasetId,
      doi,
      persistentId,
      harvestOptions: {
        includeCulturalContext: true,
        performQualityCheck: true,
        extractProvenance: true,
        ...harvestOptions
      },
      enrichmentOptions: {
        culturalContext: true,
        multilingualProcessing: false,
        gdprCompliance: true,
        sensitivityCheck: true,
        qualityAssessment: true,
        accessibilityAnalysis: true,
        ...enrichmentOptions
      },
      didOptions: {
        publishToDKG: false,
        storeOnFilecoin: true,
        expirationDays: 365,
        credentialType: 'CulturalHeritageDatasetCredential',
        accessControl: 'open',
        ...didOptions
      }
    });

    res.json({
      success: true,
      pipeline: result,
      message: 'Complete BioAgents pipeline executed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Enhanced BioAgents] Complete pipeline failed:', error);
    res.status(500).json({
      error: 'Complete pipeline failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/enhanced-bioagents/analyze-cultural-sensitivity
 * Specialized cultural sensitivity analysis
 */
router.post('/analyze-cultural-sensitivity', async (req: Request, res: Response) => {
  try {
    const { content, type = 'text', context = {} } = req.body;

    if (!content) {
      return res.status(400).json({
        error: 'Content is required for analysis',
        code: 'MISSING_CONTENT'
      });
    }

    // Use the enrichment service for cultural analysis
    const analysisResult = await enhancedBioAgentsService.enrichMetadata({
      metadata: { 
        title: context.title || 'Cultural Content Analysis',
        description: content,
        type: type,
        ...context
      },
      options: {
        culturalContext: true,
        sensitivityCheck: true,
        gdprCompliance: true,
        qualityAssessment: false,
        multilingualProcessing: false,
        accessibilityAnalysis: false
      }
    });

    const culturalAnalysis = {
      sensitivity: analysisResult.enrichedMetadata.enrichment.culturalContext,
      gdprCompliance: analysisResult.enrichedMetadata.enrichment.gdprCompliance,
      recommendations: [
        ...(analysisResult.enrichedMetadata.enrichment.culturalContext?.sensitivePractices || []),
        ...(analysisResult.enrichedMetadata.enrichment.gdprCompliance?.recommendations || [])
      ],
      riskLevel: analysisResult.enrichedMetadata.enrichment.culturalContext?.recommendedAccessLevel || 'open',
      processingMetrics: analysisResult.metrics
    };

    res.json({
      success: true,
      analysis: culturalAnalysis,
      auditTrail: analysisResult.auditTrail,
      message: 'Cultural sensitivity analysis completed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Enhanced BioAgents] Cultural sensitivity analysis failed:', error);
    res.status(500).json({
      error: 'Cultural sensitivity analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/enhanced-bioagents/status
 * Get comprehensive service status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await enhancedBioAgentsService.getServiceStatus();

    res.json({
      service: 'Enhanced BioAgents',
      ...status,
      capabilities: [
        'metadata-harvest',
        'ai-enrichment',
        'cultural-analysis',
        'gdpr-compliance',
        'quality-assessment',
        'accessibility-analysis',
        'did-issuance',
        'complete-workflow'
      ],
      features: {
        culturalHeritageSpecialization: true,
        multilingualSupport: true,
        gdprCompliance: true,
        qualityAssessment: true,
        accessibilityAnalysis: true,
        provenanceTracking: true,
        auditTrail: true
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(503).json({
      service: 'Enhanced BioAgents',
      status: 'unhealthy',
      error: 'Status check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export { router as enhancedBioAgentsRoutes };