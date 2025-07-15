import express, { Request, Response } from 'express';

const router = express.Router();

// In-memory metadata storage (replace with proper database in production)
const metadataStore = new Map<string, any>();

/**
 * POST /api/metadata/store
 * Store enriched metadata
 */
router.post('/store', async (req: Request, res: Response) => {
  try {
    const { id, metadata, type = 'enriched', version = '1.0.0' } = req.body;

    if (!id || !metadata) {
      return res.status(400).json({
        error: 'id and metadata are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    const metadataRecord = {
      id,
      metadata,
      type,
      version,
      stored: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    metadataStore.set(id, metadataRecord);

    res.status(201).json({
      success: true,
      metadataRecord: {
        id: metadataRecord.id,
        type: metadataRecord.type,
        version: metadataRecord.version,
        stored: metadataRecord.stored
      },
      message: 'Metadata stored successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Metadata storage error:', error);
    res.status(500).json({
      error: 'Failed to store metadata',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/metadata/:id
 * Retrieve metadata by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const metadataRecord = metadataStore.get(id);

    if (!metadataRecord) {
      return res.status(404).json({
        error: 'Metadata not found',
        code: 'METADATA_NOT_FOUND',
        id
      });
    }

    res.json({
      success: true,
      metadataRecord,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Metadata retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve metadata',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * PUT /api/metadata/:id
 * Update metadata
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { metadata, type, version } = req.body;

    const existingRecord = metadataStore.get(id);

    if (!existingRecord) {
      return res.status(404).json({
        error: 'Metadata not found',
        code: 'METADATA_NOT_FOUND',
        id
      });
    }

    const updatedRecord = {
      ...existingRecord,
      metadata: metadata || existingRecord.metadata,
      type: type || existingRecord.type,
      version: version || existingRecord.version,
      lastModified: new Date().toISOString()
    };

    metadataStore.set(id, updatedRecord);

    res.json({
      success: true,
      metadataRecord: {
        id: updatedRecord.id,
        type: updatedRecord.type,
        version: updatedRecord.version,
        lastModified: updatedRecord.lastModified
      },
      message: 'Metadata updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Metadata update error:', error);
    res.status(500).json({
      error: 'Failed to update metadata',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * DELETE /api/metadata/:id
 * Delete metadata
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = metadataStore.delete(id);

    if (!deleted) {
      return res.status(404).json({
        error: 'Metadata not found',
        code: 'METADATA_NOT_FOUND',
        id
      });
    }

    res.json({
      success: true,
      id,
      deleted: true,
      message: 'Metadata deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Metadata deletion error:', error);
    res.status(500).json({
      error: 'Failed to delete metadata',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/metadata/list
 * List all metadata with pagination
 */
router.get('/list', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, type } = req.query;

    let records = Array.from(metadataStore.values());

    // Filter by type if specified
    if (type) {
      records = records.filter(record => record.type === type);
    }

    // Pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedRecords = records.slice(startIndex, endIndex);

    res.json({
      success: true,
      metadata: paginatedRecords.map(record => ({
        id: record.id,
        type: record.type,
        version: record.version,
        stored: record.stored,
        lastModified: record.lastModified
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: records.length,
        totalPages: Math.ceil(records.length / Number(limit))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Metadata list error:', error);
    res.status(500).json({
      error: 'Failed to list metadata',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/metadata/health
 * Health check for metadata service
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    res.json({
      service: 'Metadata Management',
      status: 'healthy',
      storageSize: metadataStore.size,
      capabilities: [
        'store',
        'retrieve',
        'update',
        'delete',
        'list'
      ],
      features: {
        versioning: true,
        timestamping: true,
        typeClassification: true,
        pagination: true
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(503).json({
      service: 'Metadata Management',
      status: 'unhealthy',
      error: 'Metadata service unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

export { router as metadataRoutes };
