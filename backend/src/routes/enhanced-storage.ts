import express, { Request, Response } from 'express';
import { textilePowergateService } from '../services/textilePowergateService';
import { enhancedBioAgentsService } from '../services/enhancedBioAgentsService';
import { veramoDIDService } from '../services/veramoDIDService';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
    files: 10 // Allow multiple files
  },
  fileFilter: (req, file, cb) => {
    // Allow various file types for cultural heritage data
    const allowedMimeTypes = [
      'application/pdf',
      'application/zip',
      'application/json',
      'text/csv',
      'text/plain',
      'application/xml',
      'image/jpeg',
      'image/png',
      'image/tiff',
      'audio/mpeg',
      'audio/wav',
      'video/mp4',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not supported`));
    }
  }
});

/**
 * POST /api/enhanced-storage/complete-workflow
 * Execute complete DNA_ID workflow: harvest -> enrich -> store -> issue DID
 */
router.post('/complete-workflow', upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const {
      datasetId,
      doi,
      persistentId,
      metadata,
      harvestOptions = {},
      enrichmentOptions = {},
      didOptions = {},
      storageOptions = {}
    } = req.body;

    const files = req.files as Express.Multer.File[];
    const workflowId = uuidv4();

    console.log('[Enhanced Storage] Starting complete workflow:', {
      workflowId,
      datasetId,
      doi,
      persistentId,
      filesCount: files?.length || 0
    });

    // Step 1: Harvest metadata (if dataset identifiers provided)
    let harvestResult = null;
    if (datasetId || doi || persistentId) {
      harvestResult = await enhancedBioAgentsService.harvestMetadata({
        datasetId,
        doi,
        persistentId,
        options: {
          includeCulturalContext: true,
          performQualityCheck: true,
          extractProvenance: true,
          ...harvestOptions
        }
      });
    }

    // Use harvested metadata or provided metadata
    const baseMetadata = harvestResult?.metadata || metadata;
    if (!baseMetadata) {
      return res.status(400).json({
        error: 'No metadata available',
        message: 'Either provide dataset identifiers for harvesting or metadata directly'
      });
    }

    // Step 2: Enrich metadata with AI
    const enrichmentResult = await enhancedBioAgentsService.enrichMetadata({
      metadata: baseMetadata,
      options: {
        culturalContext: true,
        multilingualProcessing: false,
        gdprCompliance: true,
        sensitivityCheck: true,
        qualityAssessment: true,
        accessibilityAnalysis: true,
        ...enrichmentOptions
      }
    });

    // Step 3: Create DID and issue credential
    const didCreationResult = await veramoDIDService.createDIDWithCredential(
      {
        method: 'ethr',
        network: 'goerli',
        metadata: enrichmentResult.enrichedMetadata,
        culturalHeritage: enrichmentResult.enrichedMetadata.enrichment.culturalContext?.significance ? true : false,
        gdprCompliant: enrichmentResult.enrichedMetadata.enrichment.gdprCompliance?.complianceScore > 80
      },
      enrichmentResult.enrichedMetadata,
      {
        type: [didOptions.credentialType || 'CulturalHeritageDatasetCredential'],
        expirationDays: didOptions.expirationDays || 365,
        credentialSubject: {
          dataset: enrichmentResult.enrichedMetadata.original,
          enrichment: enrichmentResult.enrichedMetadata.enrichment,
          culturalHeritage: enrichmentResult.enrichedMetadata.enrichment.culturalContext?.significance ? true : false
        },
        evidence: harvestResult ? [{
          id: `urn:evidence:${workflowId}`,
          type: ['DataverseHarvest'],
          verifier: 'DNA_ID_BioAgents',
          evidenceDocument: harvestResult.provenance
        }] : undefined
      }
    );

    // Step 4: Store on Filecoin via Powergate
    const didStorageResult = await textilePowergateService.storeDIDDocument(didCreationResult.didDocument);
    
    let credentialStorageResult = null;
    if (didCreationResult.verifiableCredential) {
      credentialStorageResult = await textilePowergateService.storeVerifiableCredentials([didCreationResult.verifiableCredential]);
    }

    // Step 5: Store files if provided
    const fileStorageResults = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const fileResult = await textilePowergateService.storeData(
          file.buffer,
          `file-${file.originalname}`,
          {
            hot: { enabled: true, allowUnfreeze: true },
            cold: {
              enabled: true,
              filecoin: {
                repFactor: 1,
                dealMinDuration: 518400,
                verifiedDeal: false
              }
            }
          }
        );
        
        fileStorageResults.push({
          filename: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          cid: fileResult.cid,
          jobId: fileResult.jobId
        });
      }
    }

    // Compile workflow result
    const workflowResult = {
      workflowId,
      success: true,
      steps: [
        {
          step: 'metadata-harvest',
          status: harvestResult ? 'completed' : 'skipped',
          result: harvestResult,
          timestamp: new Date().toISOString()
        },
        {
          step: 'metadata-enrichment',
          status: 'completed',
          result: enrichmentResult,
          timestamp: new Date().toISOString()
        },
        {
          step: 'did-creation',
          status: 'completed',
          result: didCreationResult,
          timestamp: new Date().toISOString()
        },
        {
          step: 'filecoin-storage',
          status: 'completed',
          result: {
            didDocument: didStorageResult,
            credential: credentialStorageResult,
            files: fileStorageResults
          },
          timestamp: new Date().toISOString()
        }
      ],
      summary: {
        did: didCreationResult.did,
        credentialId: didCreationResult.verifiableCredential?.id,
        didDocumentCid: didStorageResult.cid,
        credentialCid: credentialStorageResult?.cid,
        filesStored: fileStorageResults.length,
        totalStorageJobs: 2 + fileStorageResults.length,
        culturalHeritage: enrichmentResult.enrichedMetadata.enrichment.culturalContext?.significance ? true : false,
        gdprCompliant: enrichmentResult.enrichedMetadata.enrichment.gdprCompliance?.complianceScore > 80,
        qualityScore: enrichmentResult.enrichedMetadata.enrichment.qualityAssessment?.completenessScore || 0
      }
    };

    res.status(201).json({
      success: true,
      workflow: workflowResult,
      message: 'Complete DNA_ID workflow executed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Enhanced Storage] Complete workflow failed:', error);
    res.status(500).json({
      error: 'Complete workflow failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/enhanced-storage/store-did
 * Store DID document on Filecoin with enhanced metadata
 */
router.post('/store-did', async (req: Request, res: Response) => {
  try {
    const { didDocument, metadata = {}, storageConfig } = req.body;

    if (!didDocument) {
      return res.status(400).json({
        error: 'DID document is required',
        code: 'MISSING_DID_DOCUMENT'
      });
    }

    // Enhance DID document with additional metadata
    const enhancedDIDDocument = {
      ...didDocument,
      'dna-id:metadata': {
        ...metadata,
        storedAt: new Date().toISOString(),
        storageProvider: 'textile-powergate',
        version: '2.0.0'
      }
    };

    const result = await textilePowergateService.storeDIDDocument(enhancedDIDDocument);

    res.json({
      success: true,
      storage: {
        cid: result.cid,
        jobId: result.jobId,
        size: result.size,
        timestamp: result.timestamp,
        retrievalUrl: `https://ipfs.io/ipfs/${result.cid}`,
        powergateUrl: `${process.env.POWERGATE_HOST}/ffs/info/${result.cid}`
      },
      didDocument: enhancedDIDDocument,
      message: 'DID document stored on Filecoin successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Enhanced Storage] DID storage failed:', error);
    res.status(500).json({
      error: 'DID storage failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/enhanced-storage/retrieve/:cid
 * Retrieve data from Filecoin with verification
 */
router.get('/retrieve/:cid', async (req: Request, res: Response) => {
  try {
    const { cid } = req.params;
    const { verify = false } = req.query;

    if (!cid) {
      return res.status(400).json({
        error: 'CID is required',
        code: 'MISSING_CID'
      });
    }

    console.log('[Enhanced Storage] Retrieving data:', { cid, verify });

    // Retrieve data from Powergate
    const data = await textilePowergateService.retrieveData(cid);
    
    // Get storage info
    const storageInfo = await textilePowergateService.getStorageInfo(cid);

    let verificationResult = null;
    if (verify && data.type?.includes('VerifiableCredential')) {
      try {
        verificationResult = await veramoDIDService.verifyCredential(data);
      } catch (error) {
        console.warn('[Enhanced Storage] Credential verification failed:', error);
      }
    }

    res.json({
      success: true,
      data,
      storage: {
        cid,
        info: storageInfo,
        retrievedAt: new Date().toISOString()
      },
      verification: verificationResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Enhanced Storage] Data retrieval failed:', error);
    res.status(500).json({
      error: 'Data retrieval failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/enhanced-storage/job-status/:jobId
 * Get detailed job status from Powergate
 */
router.get('/job-status/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const jobStatus = await textilePowergateService.getJobStatus(jobId);

    res.json({
      success: true,
      job: jobStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Enhanced Storage] Job status retrieval failed:', error);
    res.status(500).json({
      error: 'Job status retrieval failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/enhanced-storage/health
 * Comprehensive health check for all services
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const [powergateTest, bioAgentsStatus, veramoTest] = await Promise.allSettled([
      textilePowergateService.testConnection(),
      enhancedBioAgentsService.getServiceStatus(),
      veramoDIDService.testService()
    ]);

    const powergateHealth = powergateTest.status === 'fulfilled' ? powergateTest.value : false;
    const bioAgentsHealth = bioAgentsStatus.status === 'fulfilled' ? bioAgentsStatus.value : { status: 'unhealthy' };
    const veramoHealth = veramoTest.status === 'fulfilled' ? veramoTest.value : { status: 'unhealthy' };

    const overallStatus = powergateHealth && 
                         bioAgentsHealth.status === 'healthy' && 
                         veramoHealth.status === 'healthy' 
                         ? 'healthy' : 'degraded';

    res.json({
      service: 'Enhanced Storage Infrastructure',
      status: overallStatus,
      components: {
        powergate: {
          status: powergateHealth ? 'healthy' : 'unhealthy',
          connected: powergateHealth
        },
        bioAgents: bioAgentsHealth,
        veramo: veramoHealth
      },
      capabilities: [
        'complete-workflow',
        'metadata-harvest',
        'ai-enrichment',
        'did-creation',
        'credential-issuance',
        'filecoin-storage',
        'data-retrieval',
        'gdpr-compliance'
      ],
      features: {
        culturalHeritageSpecialization: true,
        gdprCompliance: true,
        aiPoweredEnrichment: true,
        decentralizedStorage: true,
        verifiableCredentials: true,
        multiFileSupport: true,
        provenanceTracking: true
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(503).json({
      service: 'Enhanced Storage Infrastructure',
      status: 'unhealthy',
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * DELETE /api/enhanced-storage/remove/:cid
 * Remove data from storage (GDPR compliance)
 */
router.delete('/remove/:cid', async (req: Request, res: Response) => {
  try {
    const { cid } = req.params;
    const { reason = 'user_request', userConsent = false } = req.body;

    if (!userConsent) {
      return res.status(400).json({
        error: 'User consent required for data deletion',
        code: 'CONSENT_REQUIRED'
      });
    }

    await textilePowergateService.removeData(cid);

    res.json({
      success: true,
      cid,
      removed: true,
      reason,
      gdprCompliant: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Enhanced Storage] Data removal failed:', error);
    res.status(500).json({
      error: 'Data removal failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/enhanced-storage/list
 * List all stored data with enhanced metadata
 */
router.get('/list', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, type, culturalHeritage } = req.query;

    const storedData = await textilePowergateService.listStoredData();
    
    // Apply filters
    let filteredData = storedData;
    if (type) {
      filteredData = filteredData.filter((item: any) => item.type === type);
    }
    if (culturalHeritage !== undefined) {
      const isCultural = culturalHeritage === 'true';
      filteredData = filteredData.filter((item: any) => item.culturalHeritage === isCultural);
    }

    // Pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedData = filteredData.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedData,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredData.length,
        totalPages: Math.ceil(filteredData.length / Number(limit))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Enhanced Storage] Data listing failed:', error);
    res.status(500).json({
      error: 'Data listing failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export { router as enhancedStorageRoutes };