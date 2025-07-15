import express, { Request, Response } from 'express';
import { createHeliXIDBioAgent } from '../../../bioagents/src/index';
import { AgentConfig } from '../../../bioagents/src/core/AgentCore';

const router = express.Router();

// Initialize BioAgent
let bioAgent: any = null;

const initializeBioAgent = async () => {
  if (!bioAgent) {
    const config: AgentConfig = {
      llm: {
        provider: 'openai',
        model: process.env.OPENAI_MODEL || 'gpt-4',
        apiKey: process.env.OPENAI_API_KEY,
        temperature: 0.3,
        maxTokens: 2000
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

    bioAgent = await createHeliXIDBioAgent(config);
    console.log('[BioAgents] Initialized with plugins:', bioAgent.listPlugins());
  }
  return bioAgent;
};

/**
 * POST /api/bioagents/harvest
 * Harvest metadata from Dataverse
 */
router.post('/harvest', async (req: Request, res: Response) => {
  try {
    const { datasetId, doi, persistentId } = req.body;

    if (!datasetId && !doi && !persistentId) {
      return res.status(400).json({
        error: 'One of datasetId, doi, or persistentId is required',
        code: 'MISSING_DATASET_IDENTIFIER'
      });
    }

    const agent = await initializeBioAgent();
    const result = await agent.executeWorkflow('test-harvest', {
      datasetId,
      doi,
      persistentId
    });

    res.json({
      success: result.success,
      harvest: {
        metadata: result.data,
        metrics: result.metrics,
        auditTrail: result.auditTrail
      },
      message: 'Dataset metadata harvested successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('BioAgents harvest error:', error);
    res.status(500).json({
      error: 'Failed to harvest metadata',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/bioagents/enrich
 * Enrich metadata using AI
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

    const agent = await initializeBioAgent();
    const result = await agent.executeWorkflow('test-enrichment', {
      metadata,
      options: {
        culturalContext: options.culturalContext ?? true,
        multilingualProcessing: options.multilingualProcessing ?? false,
        gdprCompliance: options.gdprCompliance ?? true,
        sensitivityCheck: options.sensitivityCheck ?? true,
        qualityAssessment: options.qualityAssessment ?? true,
        ...options
      }
    });

    res.json({
      success: result.success,
      enrichment: {
        enrichedMetadata: result.data,
        metrics: result.metrics,
        auditTrail: result.auditTrail
      },
      message: 'Metadata enriched successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('BioAgents enrichment error:', error);
    res.status(500).json({
      error: 'Failed to enrich metadata',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/bioagents/issue-did
 * Issue DID and Verifiable Credential
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

    const agent = await initializeBioAgent();
    const result = await agent.executeWorkflow('test-did-issuance', {
      enrichedMetadata,
      options: {
        publishToDKG: options.publishToDKG ?? false, // Default false for test
        expirationDays: options.expirationDays ?? 365,
        credentialType: options.credentialType ?? 'CulturalHeritageDatasetCredential',
        ...options
      }
    });

    res.json({
      success: result.success,
      didIssuance: {
        didResult: result.data,
        metrics: result.metrics,
        auditTrail: result.auditTrail
      },
      message: 'DID and VC issued successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('BioAgents DID issuance error:', error);
    res.status(500).json({
      error: 'Failed to issue DID',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/bioagents/complete-workflow
 * Execute complete harvest-enrich-issue workflow
 */
router.post('/complete-workflow', async (req: Request, res: Response) => {
  try {
    const { 
      datasetId, 
      doi, 
      persistentId, 
      enrichmentOptions = {}, 
      didOptions = {} 
    } = req.body;

    if (!datasetId && !doi && !persistentId) {
      return res.status(400).json({
        error: 'One of datasetId, doi, or persistentId is required',
        code: 'MISSING_DATASET_IDENTIFIER'
      });
    }

    const agent = await initializeBioAgent();
    const result = await agent.executeWorkflow('harvest-enrich-issue', {
      datasetId,
      doi,
      persistentId,
      enrichmentOptions: {
        culturalContext: enrichmentOptions.culturalContext ?? true,
        multilingualProcessing: enrichmentOptions.multilingualProcessing ?? false,
        gdprCompliance: enrichmentOptions.gdprCompliance ?? true,
        sensitivityCheck: enrichmentOptions.sensitivityCheck ?? true,
        qualityAssessment: enrichmentOptions.qualityAssessment ?? true,
        ...enrichmentOptions
      },
      didOptions: {
        publishToDKG: didOptions.publishToDKG ?? true,
        expirationDays: didOptions.expirationDays ?? 365,
        credentialType: didOptions.credentialType ?? 'CulturalHeritageDatasetCredential',
        ...didOptions
      }
    });

    res.json({
      success: result.success,
      workflow: {
        result: result.data,
        metrics: result.metrics,
        auditTrail: result.auditTrail,
        summary: result.data?.summary
      },
      message: 'Complete BioAgents workflow executed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('BioAgents complete workflow error:', error);
    res.status(500).json({
      error: 'Failed to execute complete workflow',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/bioagents/analyze
 * Analyze cultural heritage content for sensitivity
 */
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { content, type = 'text', options = {} } = req.body;

    if (!content) {
      return res.status(400).json({
        error: 'Content is required',
        code: 'MISSING_CONTENT'
      });
    }

    const agent = await initializeBioAgent();
    
    // Use the enricher plugin directly for analysis
    const analysis = await agent.executePlugin('langchain-enricher', {
      metadata: { content, type },
      options: {
        culturalContext: true,
        sensitivityCheck: true,
        gdprCompliance: true,
        ...options
      }
    });

    res.json({
      success: true,
      analysis: {
        culturalSensitivity: analysis.enrichment?.culturalContext,
        gdprCompliance: analysis.enrichment?.gdprCompliance,
        qualityAssessment: analysis.enrichment?.qualityAssessment,
        recommendations: analysis.enrichment?.recommendations || []
      },
      message: 'Content analyzed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('BioAgents analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze content',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/bioagents/plugins
 * List available plugins
 */
router.get('/plugins', async (req: Request, res: Response) => {
  try {
    const agent = await initializeBioAgent();
    const plugins = agent.listPlugins();

    res.json({
      success: true,
      plugins,
      count: plugins.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('BioAgents plugins error:', error);
    res.status(500).json({
      error: 'Failed to list plugins',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/bioagents/workflows
 * List available workflows
 */
router.get('/workflows', async (req: Request, res: Response) => {
  try {
    const agent = await initializeBioAgent();
    const workflows = agent.listWorkflows();

    res.json({
      success: true,
      workflows,
      count: workflows.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('BioAgents workflows error:', error);
    res.status(500).json({
      error: 'Failed to list workflows',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/bioagents/health
 * Health check for BioAgents service
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const agent = await initializeBioAgent();
    const plugins = agent.listPlugins();
    const workflows = agent.listWorkflows();

    res.json({
      service: 'BioAgents AI Processing',
      status: 'healthy',
      initialized: true,
      pluginsCount: plugins.length,
      workflowsCount: workflows.length,
      plugins: plugins.map((p: any) => ({ name: p.name, version: p.version })),
      workflows,
      capabilities: [
        'harvest',
        'enrich',
        'issue-did',
        'complete-workflow',
        'analyze'
      ],
      features: {
        aiEnrichment: true,
        culturalHeritage: true,
        gdprCompliance: true,
        multilingualProcessing: true,
        qualityAssessment: true,
        sensitivityCheck: true,
        provenanceTracking: true
      },
      config: {
        llmProvider: process.env.OPENAI_API_KEY ? 'openai' : 'not-configured',
        dataverseIntegration: !!process.env.DATAVERSE_API_URL,
        dkgIntegration: !!process.env.ORIGINTRAIL_NODE_URL
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(503).json({
      service: 'BioAgents AI Processing',
      status: 'unhealthy',
      error: 'Failed to initialize BioAgents',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export { router as bioAgentsRoutes };
