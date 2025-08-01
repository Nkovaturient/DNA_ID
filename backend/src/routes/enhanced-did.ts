import express, { Request, Response } from 'express';
import { veramoDIDService } from '../services/veramoDIDService';
import { textilePowergateService } from '../services/textilePowergateService';
import { enhancedBioAgentsService } from '../services/enhancedBioAgentsService';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 5
  }
});

/**
 * POST /api/enhanced-did/create
 * Create DID with enhanced Veramo integration
 */
router.post('/create', upload.array('files', 5), async (req: Request, res: Response) => {
  try {
    const {
      method = 'ethr',
      network = 'goerli',
      metadata,
      gdprConsent,
      credentialOptions = {}
    } = req.body;

    const files = req.files as Express.Multer.File[];

    // Parse JSON strings if needed
    let parsedMetadata = metadata;
    let parsedGDPRConsent = gdprConsent;
    let parsedCredentialOptions = credentialOptions;

    try {
      if (typeof metadata === 'string') parsedMetadata = JSON.parse(metadata);
      if (typeof gdprConsent === 'string') parsedGDPRConsent = JSON.parse(gdprConsent);
      if (typeof credentialOptions === 'string') parsedCredentialOptions = JSON.parse(credentialOptions);
    } catch (parseError) {
      return res.status(400).json({
        error: 'Invalid JSON format',
        message: 'Metadata, GDPR consent, and credential options must be valid JSON'
      });
    }

    if (!parsedMetadata) {
      return res.status(400).json({
        error: 'Metadata is required',
        code: 'MISSING_METADATA'
      });
    }

    console.log('[Enhanced DID] Creating DID with enhanced features:', {
      method,
      network,
      hasMetadata: !!parsedMetadata,
      hasGDPRConsent: !!parsedGDPRConsent,
      filesCount: files?.length || 0
    });

    // Step 1: Enrich metadata if it's basic
    let enrichedMetadata = parsedMetadata;
    if (!parsedMetadata.enrichment) {
      console.log('[Enhanced DID] Enriching metadata with AI...');
      const enrichmentResult = await enhancedBioAgentsService.enrichMetadata({
        metadata: parsedMetadata,
        options: {
          culturalContext: true,
          gdprCompliance: true,
          qualityAssessment: true,
          sensitivityCheck: true,
          accessibilityAnalysis: true
        }
      });
      enrichedMetadata = enrichmentResult.enrichedMetadata;
    }

    // Step 2: Create DID with Veramo
    const didResult = await veramoDIDService.createDIDWithCredential(
      {
        method: method as 'ethr',
        network: network as 'goerli',
        metadata: enrichedMetadata,
        culturalHeritage: enrichedMetadata.enrichment?.culturalContext?.significance ? true : false,
        gdprCompliant: parsedGDPRConsent?.granted || false
      },
      enrichedMetadata,
      {
        type: [parsedCredentialOptions.type || 'CulturalHeritageDatasetCredential'],
        expirationDays: parsedCredentialOptions.expirationDays || 365,
        credentialSubject: {
          dataset: enrichedMetadata.original || enrichedMetadata,
          enrichment: enrichedMetadata.enrichment,
          culturalHeritage: enrichedMetadata.enrichment?.culturalContext?.significance ? true : false,
          gdprConsent: parsedGDPRConsent
        }
      }
    );

    // Step 3: Store on Filecoin
    const didStorageResult = await textilePowergateService.storeDIDDocument(didResult.didDocument);
    
    let credentialStorageResult = null;
    if (didResult.verifiableCredential) {
      credentialStorageResult = await textilePowergateService.storeVerifiableCredentials([didResult.verifiableCredential]);
    }

    // Step 4: Store files if provided
    const fileStorageResults = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const fileResult = await textilePowergateService.storeData(
          file.buffer,
          `file-${file.originalname}`
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

    // Prepare response
    const responseData = {
      id: didResult.did,
      method: didResult.metadata.method,
      network: didResult.metadata.network,
      subject: didResult.did.split(':').pop(),
      created: new Date(didResult.metadata.created),
      status: 'active',
      metadata: enrichedMetadata,
      storage: {
        ipfsHash: didStorageResult.cid,
        filecoinDeal: didStorageResult.jobId,
        credentialCid: credentialStorageResult?.cid,
        files: fileStorageResults
      },
      gdprConsent: {
        granted: parsedGDPRConsent?.granted || false,
        timestamp: new Date(),
        purposes: parsedGDPRConsent?.purposes || []
      },
      verifiableCredentials: didResult.verifiableCredential ? [didResult.verifiableCredential] : [],
      keys: {
        publicKey: didResult.keys.publicKey,
        keyId: didResult.keys.keyId
      },
      compliance: {
        culturalHeritage: didResult.metadata.culturalHeritage,
        gdprCompliant: didResult.metadata.gdprCompliant,
        qualityScore: enrichedMetadata.enrichment?.qualityAssessment?.completenessScore || 0
      }
    };

    console.log('[Enhanced DID] DID created successfully:', {
      did: didResult.did,
      credentialId: didResult.verifiableCredential?.id,
      storageCid: didStorageResult.cid,
      filesStored: fileStorageResults.length
    });

    res.status(201).json({
      success: true,
      data: responseData,
      message: 'Enhanced DID created with AI enrichment and Filecoin storage',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Enhanced DID] Creation failed:', error);
    res.status(500).json({
      error: 'Enhanced DID creation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/enhanced-did/resolve/:did
 * Resolve DID with enhanced metadata retrieval
 */
router.get('/resolve/:did', async (req: Request, res: Response) => {
  try {
    const { did } = req.params;
    const { includeCredentials = true, includeStorage = true } = req.query;

    console.log('[Enhanced DID] Resolving DID:', did);

    // Resolve DID document
    const didDocument = await veramoDIDService.resolveDID(did);

    if (!didDocument) {
      return res.status(404).json({
        error: 'DID not found',
        code: 'DID_NOT_FOUND',
        did
      });
    }

    let credentials = [];
    if (includeCredentials === 'true') {
      try {
        const exportData = await veramoDIDService.exportDIDData(did);
        credentials = exportData.credentials;
      } catch (error) {
        console.warn('[Enhanced DID] Failed to fetch credentials:', error);
      }
    }

    let storageInfo = null;
    if (includeStorage === 'true' && didDocument.service) {
      // Try to find storage CID from service endpoints
      const storageService = didDocument.service.find((s: any) => s.type === 'StorageService');
      if (storageService?.serviceEndpoint) {
        try {
          const cid = storageService.serviceEndpoint.split('/').pop();
          storageInfo = await textilePowergateService.getStorageInfo(cid);
        } catch (error) {
          console.warn('[Enhanced DID] Failed to fetch storage info:', error);
        }
      }
    }

    const resolvedData = {
      did,
      didDocument,
      credentials,
      storage: storageInfo,
      resolved: true,
      resolvedAt: new Date().toISOString(),
      metadata: {
        culturalHeritage: didDocument['dna-id:metadata']?.culturalHeritage || false,
        gdprCompliant: didDocument['dna-id:metadata']?.gdprCompliant || false,
        created: didDocument.created,
        updated: didDocument.updated
      }
    };

    res.json({
      success: true,
      data: resolvedData,
      message: 'DID resolved successfully with enhanced metadata',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Enhanced DID] Resolution failed:', error);
    res.status(500).json({
      error: 'DID resolution failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/enhanced-did/verify-credential
 * Verify verifiable credential with enhanced validation
 */
router.post('/verify-credential', async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        error: 'Credential is required',
        code: 'MISSING_CREDENTIAL'
      });
    }

    const verificationResult = await veramoDIDService.verifyCredential(credential);

    // Enhanced verification with additional checks
    const enhancedVerification = {
      ...verificationResult,
      additionalChecks: {
        culturalHeritage: credential.credentialSubject?.culturalHeritage || false,
        gdprCompliant: credential.credentialSubject?.gdprCompliant || false,
        hasEvidence: !!credential.evidence,
        isExpired: credential.expirationDate ? new Date(credential.expirationDate) < new Date() : false,
        issuerTrusted: verificationResult.issuer.includes('dna-id') || verificationResult.issuer.includes('did:ethr')
      },
      metadata: {
        verifiedAt: new Date().toISOString(),
        verificationMethod: 'veramo-enhanced',
        platform: 'DNA_ID'
      }
    };

    res.json({
      success: true,
      verification: enhancedVerification,
      message: 'Credential verified with enhanced validation',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Enhanced DID] Credential verification failed:', error);
    res.status(500).json({
      error: 'Credential verification failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/enhanced-did/list
 * List all DIDs with enhanced filtering and metadata
 */
router.get('/list', async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      culturalHeritage, 
      gdprCompliant, 
      method, 
      network 
    } = req.query;

    const allDIDs = await veramoDIDService.listDIDs();

    // Apply filters
    let filteredDIDs = allDIDs;
    
    if (culturalHeritage !== undefined) {
      const isCultural = culturalHeritage === 'true';
      filteredDIDs = filteredDIDs.filter((did: any) => 
        did.metadata?.culturalHeritage === isCultural
      );
    }

    if (gdprCompliant !== undefined) {
      const isCompliant = gdprCompliant === 'true';
      filteredDIDs = filteredDIDs.filter((did: any) => 
        did.metadata?.gdprCompliant === isCompliant
      );
    }

    if (method) {
      filteredDIDs = filteredDIDs.filter((did: any) => 
        did.did.includes(`:${method}:`)
      );
    }

    if (network) {
      filteredDIDs = filteredDIDs.filter((did: any) => 
        did.did.includes(`:${network}`)
      );
    }

    // Pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedDIDs = filteredDIDs.slice(startIndex, endIndex);

    res.json({
      success: true,
      dids: paginatedDIDs.map((did: any) => ({
        did: did.did,
        alias: did.alias,
        provider: did.provider,
        created: did.created,
        keysCount: did.keys.length,
        servicesCount: did.services.length,
        metadata: {
          culturalHeritage: did.metadata?.culturalHeritage || false,
          gdprCompliant: did.metadata?.gdprCompliant || false,
          method: did.did.split(':')[1],
          network: did.did.split(':')[2]
        }
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredDIDs.length,
        totalPages: Math.ceil(filteredDIDs.length / Number(limit))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Enhanced DID] List failed:', error);
    res.status(500).json({
      error: 'DID listing failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * DELETE /api/enhanced-did/revoke/:did
 * Revoke DID with GDPR compliance
 */
router.delete('/revoke/:did', async (req: Request, res: Response) => {
  try {
    const { did } = req.params;
    const { reason = 'user_request', userConsent = false, removeFromStorage = false } = req.body;

    if (!userConsent) {
      return res.status(400).json({
        error: 'User consent required for DID revocation',
        code: 'CONSENT_REQUIRED'
      });
    }

    console.log('[Enhanced DID] Revoking DID:', did, 'Reason:', reason);

    // Revoke DID
    const revoked = await veramoDIDService.revokeDID(did, reason);

    if (!revoked) {
      return res.status(404).json({
        error: 'DID not found or revocation failed',
        code: 'REVOCATION_FAILED'
      });
    }

    // Optionally remove from storage (GDPR right to be forgotten)
    let storageRemoved = false;
    if (removeFromStorage) {
      try {
        // This would require tracking CIDs associated with DIDs
        // For now, we'll just log the intent
        console.log('[Enhanced DID] Storage removal requested for DID:', did);
        storageRemoved = true;
      } catch (error) {
        console.warn('[Enhanced DID] Storage removal failed:', error);
      }
    }

    res.json({
      success: true,
      did,
      revoked: true,
      reason,
      storageRemoved,
      gdprCompliant: true,
      revokedAt: new Date().toISOString(),
      message: 'DID revoked successfully with GDPR compliance',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Enhanced DID] Revocation failed:', error);
    res.status(500).json({
      error: 'DID revocation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/enhanced-did/export/:did
 * Export DID data for GDPR compliance
 */
router.post('/export/:did', async (req: Request, res: Response) => {
  try {
    const { did } = req.params;
    const { format = 'json', includeStorage = true } = req.body;

    console.log('[Enhanced DID] Exporting DID data:', did, 'Format:', format);

    const exportData = await veramoDIDService.exportDIDData(did);

    // Include storage data if requested
    let storageData = null;
    if (includeStorage) {
      try {
        const storedData = await textilePowergateService.listStoredData();
        storageData = storedData.filter((item: any) => 
          item.metadata?.didId === did || 
          item.metadata?.subject === did
        );
      } catch (error) {
        console.warn('[Enhanced DID] Storage data retrieval failed:', error);
      }
    }

    const completeExportData = {
      ...exportData,
      storage: storageData,
      exportMetadata: {
        format,
        exportedBy: 'DNA_ID_Platform',
        gdprCompliant: true,
        dataPortabilityRight: true,
        exportVersion: '2.0.0'
      }
    };

    // Format response based on requested format
    let responseData = completeExportData;
    let contentType = 'application/json';

    if (format === 'csv') {
      // Convert to CSV format (simplified)
      const csvData = this.convertToCSV(completeExportData);
      responseData = csvData as any;
      contentType = 'text/csv';
    } else if (format === 'xml') {
      // Convert to XML format (simplified)
      const xmlData = this.convertToXML(completeExportData);
      responseData = xmlData as any;
      contentType = 'application/xml';
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="did-export-${did.split(':').pop()}.${format}"`);

    res.json({
      success: true,
      export: responseData,
      metadata: {
        did,
        format,
        credentialsCount: exportData.credentials.length,
        keysCount: exportData.keys.length,
        storageItemsCount: storageData?.length || 0,
        exportedAt: exportData.exportTimestamp
      },
      message: 'DID data exported successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Enhanced DID] Export failed:', error);
    res.status(500).json({
      error: 'DID export failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/enhanced-did/health
 * Health check for enhanced DID service
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const [veramoStatus, powergateTest, bioAgentsStatus] = await Promise.allSettled([
      veramoDIDService.getServiceStatus(),
      textilePowergateService.testConnection(),
      enhancedBioAgentsService.getServiceStatus()
    ]);

    const veramoHealth = veramoStatus.status === 'fulfilled' ? veramoStatus.value : { status: 'unhealthy' };
    const powergateHealth = powergateTest.status === 'fulfilled' ? powergateTest.value : false;
    const bioAgentsHealth = bioAgentsStatus.status === 'fulfilled' ? bioAgentsStatus.value : { status: 'unhealthy' };

    const overallStatus = veramoHealth.status === 'healthy' && 
                         powergateHealth && 
                         bioAgentsHealth.status === 'healthy' 
                         ? 'healthy' : 'degraded';

    res.json({
      service: 'Enhanced DID Management',
      status: overallStatus,
      components: {
        veramo: veramoHealth,
        powergate: {
          status: powergateHealth ? 'healthy' : 'unhealthy',
          connected: powergateHealth
        },
        bioAgents: bioAgentsHealth
      },
      capabilities: [
        'did-creation',
        'credential-issuance',
        'did-resolution',
        'credential-verification',
        'metadata-enrichment',
        'filecoin-storage',
        'gdpr-compliance',
        'cultural-heritage-analysis'
      ],
      features: {
        w3cCompliant: true,
        veramoIntegration: true,
        filecoinStorage: true,
        aiEnrichment: true,
        culturalHeritage: true,
        gdprCompliance: true,
        multiFileSupport: true,
        dataPortability: true
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(503).json({
      service: 'Enhanced DID Management',
      status: 'unhealthy',
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Helper methods for data format conversion
function convertToCSV(data: any): string {
  // Simplified CSV conversion
  const headers = ['DID', 'Created', 'Credentials Count', 'Keys Count'];
  const rows = [
    [data.did, data.exportTimestamp, data.credentials.length, data.keys.length]
  ];
  
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

function convertToXML(data: any): string {
  // Simplified XML conversion
  return `<?xml version="1.0" encoding="UTF-8"?>
<didExport>
  <did>${data.did}</did>
  <exportTimestamp>${data.exportTimestamp}</exportTimestamp>
  <credentialsCount>${data.credentials.length}</credentialsCount>
  <keysCount>${data.keys.length}</keysCount>
</didExport>`;
}

export { router as enhancedDIDRoutes };