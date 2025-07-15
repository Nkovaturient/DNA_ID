import express, { Request, Response } from 'express';
import { lighthouseService } from '../services/lighthouseService';

const router = express.Router();

/**
 * POST /api/lighthouse/upload
 * Upload file to Lighthouse/Filecoin
 */
router.post('/upload', async (req: Request, res: Response) => {
  try {
    const { fileName, content, metadata = {} } = req.body;

    if (!fileName || !content) {
      return res.status(400).json({
        error: 'fileName and content are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    const buffer = Buffer.from(content, 'base64');
    const uploadResult = await lighthouseService.uploadFile(buffer, fileName);

    res.json({
      success: true,
      lighthouse: {
        cid: uploadResult.Hash,
        name: uploadResult.Name,
        size: uploadResult.Size,
        status: uploadResult.Status,
        dealId: uploadResult.dealId,
        url: `https://gateway.lighthouse.storage/ipfs/${uploadResult.Hash}`
      },
      metadata,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Lighthouse upload error:', error);
    res.status(500).json({
      error: 'Failed to upload to Lighthouse',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/lighthouse/store-did
 * Store DID document on Lighthouse/Filecoin
 */
router.post('/store-did', async (req: Request, res: Response) => {
  try {
    const { did, didDocument, metadata = {} } = req.body;

    if (!did || !didDocument) {
      return res.status(400).json({
        error: 'DID and didDocument are required',
        code: 'MISSING_DID_DATA'
      });
    }

    const result = await lighthouseService.storeDIDDocument(
      didDocument,
      {
        ...metadata,
        did,
        gdprCompliant: true,
        culturalHeritage: metadata.culturalHeritage || false
      }
    );

    res.json({
      success: true,
      did,
      lighthouse: {
        didDocumentCid: result.didDocumentCid,
        metadataCid: result.metadataCid,
        uploadResponse: result.uploadResponse,
        url: `https://gateway.lighthouse.storage/ipfs/${result.didDocumentCid}`
      },
      message: 'DID document stored on Lighthouse successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Lighthouse DID storage error:', error);
    res.status(500).json({
      error: 'Failed to store DID on Lighthouse',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/lighthouse/retrieve/:cid
 * Retrieve file from Lighthouse/IPFS
 */
router.get('/retrieve/:cid', async (req: Request, res: Response) => {
  try {
    const { cid } = req.params;

    const fileContent = await lighthouseService.retrieveFile(cid);

    res.json({
      success: true,
      cid,
      content: fileContent,
      retrievedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Lighthouse retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve from Lighthouse',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/lighthouse/status/:cid
 * Get file status and deal information
 */
router.get('/status/:cid', async (req: Request, res: Response) => {
  try {
    const { cid } = req.params;

    const [fileInfo, dealStatus] = await Promise.all([
      lighthouseService.getFileInfo(cid),
      lighthouseService.getDealStatus(cid)
    ]);

    res.json({
      success: true,
      cid,
      fileInfo,
      dealStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Lighthouse status error:', error);
    res.status(500).json({
      error: 'Failed to get Lighthouse status',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/lighthouse/store-complete
 * Complete storage workflow for DNA_ID pipeline
 */
router.post('/store-complete', async (req: Request, res: Response) => {
  try {
    const { didDocument, enrichedMetadata, originalFile, fileName, metadata } = req.body;

    const result = await lighthouseService.storeComplete({
      didDocument,
      enrichedMetadata,
      originalFile: originalFile ? Buffer.from(originalFile, 'base64') : undefined,
      fileName,
      metadata
    });

    res.json({
      success: true,
      lighthouse: {
        didDocumentResult: result.didDocumentResult,
        metadataResult: result.metadataResult,
        fileResult: result.fileResult,
        summary: result.summary
      },
      message: 'Complete storage workflow completed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Lighthouse complete storage error:', error);
    res.status(500).json({
      error: 'Failed to complete storage workflow',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/lighthouse/health
 * Health check for Lighthouse service
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const isConnected = await lighthouseService.testConnection();
    const stats = await lighthouseService.getStorageStats();

    res.json({
      service: 'Lighthouse Storage',
      status: isConnected ? 'healthy' : 'unhealthy',
      connected: isConnected,
      stats,
      capabilities: [
        'upload',
        'store-did',
        'retrieve',
        'status',
        'store-complete'
      ],
      features: {
        filecoinDeals: true,
        ipfsGateway: true,
        encryption: true,
        permanentStorage: true
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(503).json({
      service: 'Lighthouse Storage',
      status: 'unhealthy',
      error: 'Cannot connect to Lighthouse',
      timestamp: new Date().toISOString()
    });
  }
});

export { router as lighthouseRoutes };
