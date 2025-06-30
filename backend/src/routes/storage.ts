import express, { Request, Response } from 'express';
import { powergateService } from '../services/powergateService';
import multer from 'multer';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

/**
 * Upload data to IPFS/Filecoin via Powergate
 * POST /api/storage/upload
 */
router.post('/upload', async (req: Request, res: Response) => {
  try {
    const { data, dataType = 'data', config } = req.body;

    if (!data) {
      return res.status(400).json({
        error: 'Data is required',
        message: 'Please provide data to upload'
      });
    }

    const result = await powergateService.storeData(
      typeof data === 'string' ? data : JSON.stringify(data),
      dataType,
      config
    );

    res.json({
      success: true,
      data: result,
      message: 'Data uploaded successfully'
    });

  } catch (error: any) {
    console.error('[Storage] Upload failed:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: error.message
    });
  }
});

/**
 * Upload file to IPFS/Filecoin via Powergate
 * POST /api/storage/upload-file
 */
router.post('/upload-file', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const { dataType = 'file', config } = req.body;

    if (!file) {
      return res.status(400).json({
        error: 'File is required',
        message: 'Please provide a file to upload'
      });
    }

    const result = await powergateService.storeData(
      file.buffer,
      dataType,
      config ? JSON.parse(config) : undefined
    );

    res.json({
      success: true,
      data: {
        ...result,
        filename: file.originalname,
        size: file.size,
        mimeType: file.mimetype
      },
      message: 'File uploaded successfully'
    });

  } catch (error: any) {
    console.error('[Storage] File upload failed:', error);
    res.status(500).json({
      error: 'File upload failed',
      message: error.message
    });
  }
});

/**
 * Retrieve data from IPFS/Filecoin
 * GET /api/storage/retrieve/:cid
 */
router.get('/retrieve/:cid', async (req: Request, res: Response) => {
  try {
    const { cid } = req.params;

    if (!cid) {
      return res.status(400).json({
        error: 'CID is required',
        message: 'Please provide a valid CID'
      });
    }

    const data = await powergateService.retrieveData(cid);

    res.json({
      success: true,
      data: data,
      cid: cid
    });

  } catch (error: any) {
    console.error('[Storage] Retrieval failed:', error);
    res.status(500).json({
      error: 'Retrieval failed',
      message: error.message
    });
  }
});

/**
 * Get storage job status
 * GET /api/storage/job/:jobId
 */
router.get('/job/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({
        error: 'Job ID is required',
        message: 'Please provide a valid job ID'
      });
    }

    const jobStatus = await powergateService.getJobStatus(jobId);

    res.json({
      success: true,
      data: jobStatus
    });

  } catch (error: any) {
    console.error('[Storage] Job status check failed:', error);
    res.status(500).json({
      error: 'Job status check failed',
      message: error.message
    });
  }
});

/**
 * Get storage info for a CID
 * GET /api/storage/info/:cid
 */
router.get('/info/:cid', async (req: Request, res: Response) => {
  try {
    const { cid } = req.params;

    if (!cid) {
      return res.status(400).json({
        error: 'CID is required',
        message: 'Please provide a valid CID'
      });
    }

    const storageInfo = await powergateService.getStorageInfo(cid);

    res.json({
      success: true,
      data: storageInfo
    });

  } catch (error: any) {
    console.error('[Storage] Storage info retrieval failed:', error);
    res.status(500).json({
      error: 'Storage info retrieval failed',
      message: error.message
    });
  }
});

/**
 * List all stored data
 * GET /api/storage/list
 */
router.get('/list', async (req: Request, res: Response) => {
  try {
    const storedData = await powergateService.listStoredData();

    res.json({
      success: true,
      data: storedData,
      total: storedData.length
    });

  } catch (error: any) {
    console.error('[Storage] Data listing failed:', error);
    res.status(500).json({
      error: 'Data listing failed',
      message: error.message
    });
  }
});

/**
 * Store DID document
 * POST /api/storage/did-document
 */
router.post('/did-document', async (req: Request, res: Response) => {
  try {
    const { didDocument } = req.body;

    if (!didDocument) {
      return res.status(400).json({
        error: 'DID document is required',
        message: 'Please provide a valid DID document'
      });
    }

    const result = await powergateService.storeDIDDocument(didDocument);

    res.json({
      success: true,
      data: result,
      message: 'DID document stored successfully'
    });

  } catch (error: any) {
    console.error('[Storage] DID document storage failed:', error);
    res.status(500).json({
      error: 'DID document storage failed',
      message: error.message
    });
  }
});

/**
 * Store verifiable credentials
 * POST /api/storage/verifiable-credentials
 */
router.post('/verifiable-credentials', async (req: Request, res: Response) => {
  try {
    const { credentials } = req.body;

    if (!credentials || !Array.isArray(credentials)) {
      return res.status(400).json({
        error: 'Credentials array is required',
        message: 'Please provide a valid array of verifiable credentials'
      });
    }

    const result = await powergateService.storeVerifiableCredentials(credentials);

    res.json({
      success: true,
      data: result,
      message: 'Verifiable credentials stored successfully'
    });

  } catch (error: any) {
    console.error('[Storage] VC storage failed:', error);
    res.status(500).json({
      error: 'VC storage failed',
      message: error.message
    });
  }
});

export { router as storageRoutes };
