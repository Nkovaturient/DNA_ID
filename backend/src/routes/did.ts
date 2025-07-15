import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { DataverseAPI } from '../controllers/dataverseApi';
import lighthouse from '@lighthouse-web3/sdk';
import multer from 'multer';

const router = express.Router();

// In-memory DID storage (replace with proper database in production)
const didRegistry = new Map<string, any>();

const dataverseAPI = new DataverseAPI();

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1 // Only allow 1 file
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedMimeTypes = [
      'application/pdf',
      'application/zip',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'application/json',
      'text/csv',
      'application/xml'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not supported`));
    }
  }
});

// Error handling middleware for multer
const handleMulterError = (err: any, req: Request, res: Response, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'File size exceeds 50MB limit'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        message: 'Only one file is allowed'
      });
    }
  }

  if (err.message && err.message.includes('File type')) {
    return res.status(400).json({
      error: 'Invalid file type',
      message: err.message
    });
  }

  next(err);
};

/**
 * POST /api/did/create
 * Create a new DID with document
 */
router.post('/create', upload.single('file'), handleMulterError, async (req: Request, res: Response) => {
  try {
    console.log('DID creation request received');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request file:', req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'No file');

    // Extract fields from multipart/form-data
    const { method, metadata, gdprConsent } = req.body;
    const file = req.file;

    // Validate required fields
    if (!metadata) {
      return res.status(400).json({
        error: 'Metadata is required',
        message: 'Please provide metadata for the DID'
      });
    }

    if (!file) {
      return res.status(400).json({
        error: 'File is required',
        message: 'Please upload a file (PDF, ZIP, DOCX, etc.)'
      });
    }

    // Parse metadata/gdprConsent if sent as JSON strings
    let parsedMetadata = metadata;
    let parsedGDPR = gdprConsent;
    try {
      if (typeof metadata === 'string') parsedMetadata = JSON.parse(metadata);
      if (typeof gdprConsent === 'string') parsedGDPR = JSON.parse(gdprConsent);
    } catch (e) {
      console.error('Error parsing JSON:', e);
      return res.status(400).json({
        error: 'Invalid JSON format',
        message: 'Metadata and GDPR consent must be valid JSON'
      });
    }

    // 1. Create DID
    const didId = `did:dna_id:${uuidv4()}`;
    const didDocument: any = {
      id: didId,
      method: method || 'flow',
      subject: `0x${uuidv4().replace(/-/g, '')}`,
      created: new Date().toISOString(),
      status: 'active',
      metadata: parsedMetadata,
      storage: {
        ipfsHash: '',
        filecoinDeal: ''
      },
      gdprConsent: parsedGDPR || {
        granted: false,
        timestamp: new Date().toISOString(),
        purposes: []
      }
    };

    // 2. Upload to Lighthouse
    let lighthouseResult = null;
    const apiKey = process.env.LIGHTHOUSE_API_KEY;
    const formData = new FormData();
    formData.append('file', new Blob([file.buffer], { type: file.mimetype }), file.originalname);

    try {
      if (!apiKey) {
        console.warn('Lighthouse API key is not set, skipping IPFS upload');
      } else {
        console.log('Uploading file to Lighthouse...');

        // Upload file buffer to Lighthouse using direct API call
        const uploadResponse = await fetch('https://upload.lighthouse.storage/api/v0/add', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`
          },
          body: formData
        });

        if (!uploadResponse.ok) {
          throw new Error(`Lighthouse upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
        }

        lighthouseResult = await uploadResponse.json() as any;
        console.log('Lighthouse upload successful:', lighthouseResult);

        // Update DID document with storage information
        if (lighthouseResult && lighthouseResult.Hash) {
          didDocument.storage.ipfsHash = lighthouseResult.Hash;
          didDocument.storage.filecoinDeal = lighthouseResult.Hash; // For now, using same hash
        }
      }
    } catch (err) {
      console.error('Lighthouse upload failed:', err);
      const uploadViaSDK = await lighthouse.uploadBuffer(formData, apiKey as unknown as string)
      console.log('Lighthouse upload successful:', uploadViaSDK);

      // Update DID document with storage information
      if (uploadViaSDK && uploadViaSDK.data) {
        didDocument.storage.ipfsHash = uploadViaSDK.data;
        didDocument.storage.filecoinDeal = uploadViaSDK.data;
      }
    }

    // 3. Upload to Dataverse
    let dataverseResult = null;
    try {
      if (parsedMetadata.author && parsedMetadata.name) {
        console.log('Uploading to Dataverse...');
        dataverseResult = await dataverseAPI.createDataset(
          file.originalname,
          parsedMetadata,
          [{
            name: file.originalname,
            file: file.buffer,
          }]
        );
        console.log('Dataverse upload successful:', dataverseResult);
      }
    } catch (err) {
      console.error('Dataverse upload failed:', err);
      // Continue with DID creation even if Dataverse fails
    }

    // 4. Store DID in registry
    didRegistry.set(didId, didDocument);

    // 5. Prepare response matching frontend expectations
    const responseData = {
      id: didId,
      method: didDocument.method,
      subject: didDocument.subject,
      created: new Date(didDocument.created),
      status: didDocument.status,
      metadata: didDocument.metadata,
      storage: didDocument.storage,
      gdprConsent: didDocument.gdprConsent
    };

    console.log('DID creation successful:', didId);

    res.status(201).json({
      success: true,
      data: responseData,
      message: 'DID created and data uploaded successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('DID creation error:', error);
    res.status(500).json({
      error: 'Failed to create DID',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/did/resolve/:did
 * Resolve DID to get DID document
 */
router.get('/resolve/:did', async (req: Request, res: Response) => {
  try {
    const { did } = req.params;

    if (!did.startsWith('did:dna_id:')) {
      return res.status(400).json({
        error: 'Invalid DID format',
        code: 'INVALID_DID_FORMAT',
        expected: 'did:dna_id:*'
      });
    }

    const didDocument = didRegistry.get(did);

    if (!didDocument) {
      return res.status(404).json({
        error: 'DID not found',
        code: 'DID_NOT_FOUND',
        did
      });
    }

    res.json({
      success: true,
      did,
      didDocument,
      resolved: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('DID resolution error:', error);
    res.status(500).json({
      error: 'Failed to resolve DID',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * PUT /api/did/update/:did
 * Update DID document metadata
 */
router.put('/update/:did', async (req: Request, res: Response) => {
  try {
    const { did } = req.params;
    const { metadata, status } = req.body;

    const didDocument = didRegistry.get(did);

    if (!didDocument) {
      return res.status(404).json({
        error: 'DID not found',
        code: 'DID_NOT_FOUND'
      });
    }

    // Update metadata
    if (metadata) {
      didDocument['helixid:metadata'] = {
        ...didDocument['helixid:metadata'],
        ...metadata
      };
    }

    // Update status
    if (status) {
      didDocument['helixid:status'] = status;
    }

    // Update timestamp
    didDocument.updated = new Date().toISOString();

    // Update version
    const currentVersion = parseFloat(didDocument['helixid:version']);
    didDocument['helixid:version'] = (currentVersion + 0.1).toFixed(1);

    didRegistry.set(did, didDocument);

    res.json({
      success: true,
      did,
      didDocument,
      message: 'DID updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('DID update error:', error);
    res.status(500).json({
      error: 'Failed to update DID',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/did/list
 * List all DIDs (with pagination)
 */
router.get('/list', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, culturalHeritage } = req.query;

    let dids = Array.from(didRegistry.entries());

    // Filter by status
    if (status) {
      dids = dids.filter(([_, doc]) => doc['helixid:status'] === status);
    }

    // Filter by cultural heritage
    if (culturalHeritage !== undefined) {
      const isCultural = culturalHeritage === 'true';
      dids = dids.filter(([_, doc]) => doc['helixid:metadata'].culturalHeritage === isCultural);
    }

    // Pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedDids = dids.slice(startIndex, endIndex);

    res.json({
      success: true,
      dids: paginatedDids.map(([did, document]) => ({
        did,
        status: document['helixid:status'],
        created: document.created,
        updated: document.updated,
        culturalHeritage: document['helixid:metadata'].culturalHeritage,
        bioAgentsProcessed: document['helixid:metadata'].bioAgentsProcessed,
        gdprCompliant: document['helixid:metadata'].gdprCompliant
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: dids.length,
        totalPages: Math.ceil(dids.length / Number(limit))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('DID list error:', error);
    res.status(500).json({
      error: 'Failed to list DIDs',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * DELETE /api/did/deactivate/:did
 * Deactivate a DID (GDPR right to be forgotten)
 */
router.delete('/deactivate/:did', async (req: Request, res: Response) => {
  try {
    const { did } = req.params;
    const { reason = 'user_request' } = req.body;

    const didDocument = didRegistry.get(did);

    if (!didDocument) {
      return res.status(404).json({
        error: 'DID not found',
        code: 'DID_NOT_FOUND'
      });
    }

    // Mark as deactivated instead of deleting (for audit trail)
    didDocument['helixid:status'] = 'deactivated';
    didDocument['helixid:deactivated'] = {
      timestamp: new Date().toISOString(),
      reason,
      gdprCompliant: true
    };
    didDocument.updated = new Date().toISOString();

    didRegistry.set(did, didDocument);

    res.json({
      success: true,
      did,
      message: 'DID deactivated successfully',
      reason,
      gdprCompliant: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('DID deactivation error:', error);
    res.status(500).json({
      error: 'Failed to deactivate DID',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/did/health
 * Health check for DID service
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    service: 'DID Management',
    status: 'healthy',
    registrySize: didRegistry.size,
    version: '2.0.0',
    capabilities: [
      'create',
      'resolve',
      'update',
      'list',
      'deactivate'
    ],
    compliance: {
      w3c: true,
      gdpr: true,
      culturalHeritage: true
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/did/test-upload
 * Test endpoint for file upload functionality
 */
router.post('/test-upload', upload.single('file'), handleMulterError, async (req: Request, res: Response) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        error: 'No file provided',
        message: 'Please upload a file'
      });
    }

    // Test Lighthouse upload if API key is available
    let lighthouseTest = null;
    const apiKey = process.env.LIGHTHOUSE_API_KEY;

    if (apiKey) {
      try {
        const formData = new FormData();
        formData.append('file', new Blob([file.buffer], { type: file.mimetype }), file.originalname);

        const uploadResponse = await fetch('https://upload.lighthouse.storage/api/v0/add', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`
          },
          body: formData
        });

        if (uploadResponse.ok) {
          lighthouseTest = await uploadResponse.json() as any;
        }
      } catch (err) {
        console.error('Lighthouse test failed:', err);
      }
    }

    res.json({
      success: true,
      message: 'File upload test successful',
      file: {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      },
      lighthouse: lighthouseTest ? {
        hash: lighthouseTest.Hash,
        size: lighthouseTest.Size
      } : 'Lighthouse API key not configured or upload failed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test upload error:', error);
    res.status(500).json({
      error: 'Test upload failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as didRoutes };
