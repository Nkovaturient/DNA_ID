import express, { Request, Response } from 'express';
import { DataverseAPI } from '../controllers/dataverseApi';

const router = express.Router();
const dataverseAPI = new DataverseAPI();

/**
 * POST /api/dataverse/create
 * Create dataset on Dataverse
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { dataverseName, metadata, files } = req.body;

    if (!dataverseName || !metadata) {
      return res.status(400).json({
        error: 'dataverseName and metadata are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    const result = await dataverseAPI.createDataset(
      dataverseName,
      {
        title: metadata.title,
        author: metadata.author,
        description: metadata.description,
        subject: metadata.subject || ['Other'],
        keyword: metadata.keywords?.map((kw: string) => ({
          keywordValue: { typeName: 'keywordValue', value: kw }
        })) || [],
        culturalHeritage: metadata.culturalHeritage || false,
        depositor: metadata.depositor || 'HeliXID System',
        datasetContact: metadata.contact || 'contact@helixid.org',
        kindOfData: metadata.kindOfData,
        timePeriodCovered: metadata.timePeriodCovered,
        grantInformation: metadata.grantInformation
      },
      files
    );

    res.status(201).json({
      success: true,
      dataverse: {
        persistentId: result.data.persistentId,
        id: result.data.id,
        protocol: result.data.protocol,
        authority: result.data.authority,
        identifier: result.data.identifier,
        storageIdentifier: result.data.storageIdentifier,
        url: `${process.env.DATAVERSE_API_URL || 'https://demo.dataverse.org'}/dataset.xhtml?persistentId=${result.data.persistentId}`
      },
      message: 'Dataset created on Dataverse successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dataverse create error:', error);
    res.status(500).json({
      error: 'Failed to create dataset on Dataverse',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/dataverse/search
 * Search datasets on Dataverse
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const {
      q = '*',
      type = 'dataset',
      start = '0',
      per_page = '10',
      culturalHeritage,
      subjects,
      dateRange
    } = req.query;

    const filters: any = {};
    
    if (culturalHeritage === 'true') {
      filters.culturalHeritage = true;
    }
    
    if (subjects && typeof subjects === 'string') {
      filters.subjects = subjects.split(',');
    }
    
    if (dateRange && typeof dateRange === 'string') {
      const [start, end] = dateRange.split(',');
      filters.dateRange = { start, end };
    }

    const results = await dataverseAPI.searchDatasets(
      q as string,
      type as string,
      parseInt(start as string),
      parseInt(per_page as string),
      Object.keys(filters).length > 0 ? filters : undefined
    );

    res.json({
      success: true,
      search: {
        query: q,
        total: results.data.total_count,
        start: parseInt(start as string),
        per_page: parseInt(per_page as string),
        datasets: results.data.items?.map((item: any) => ({
          id: item.global_id,
          persistentId: item.global_id,
          title: item.name,
          description: item.description,
          authors: item.authors,
          subjects: item.subjects,
          keywords: item.keywords,
          published_at: item.published_at,
          updated_at: item.updated_at,
          url: item.url,
          type: item.type,
          citation: item.citation
        })) || []
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dataverse search error:', error);
    res.status(500).json({
      error: 'Failed to search Dataverse',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/dataverse/dataset/:persistentId
 * Get dataset details
 */
router.get('/dataset/:persistentId', async (req: Request, res: Response) => {
  try {
    const { persistentId } = req.params;

    const dataset = await dataverseAPI.getDataset(persistentId);

    res.json({
      success: true,
      dataset: {
        persistentId: dataset.persistentId,
        id: dataset.id,
        title: dataset.metadataBlocks?.citation?.fields?.find((f: any) => f.typeName === 'title')?.value,
        description: dataset.metadataBlocks?.citation?.fields?.find((f: any) => f.typeName === 'dsDescription')?.value?.[0]?.dsDescriptionValue?.value,
        authors: dataset.metadataBlocks?.citation?.fields?.find((f: any) => f.typeName === 'author')?.value || [],
        subjects: dataset.metadataBlocks?.citation?.fields?.find((f: any) => f.typeName === 'subject')?.value || [],
        keywords: dataset.metadataBlocks?.citation?.fields?.find((f: any) => f.typeName === 'keyword')?.value || [],
        depositor: dataset.metadataBlocks?.citation?.fields?.find((f: any) => f.typeName === 'depositor')?.value,
        publicationDate: dataset.publicationDate,
        createTime: dataset.createTime,
        modificationTime: dataset.modificationTime,
        versionState: dataset.versionState,
        versionNumber: dataset.versionNumber,
        minorVersionNumber: dataset.minorVersionNumber,
        metadataBlocks: dataset.metadataBlocks
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dataverse dataset retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve dataset from Dataverse',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/dataverse/upload/:persistentId
 * Upload files to dataset
 */
router.post('/upload/:persistentId', async (req: Request, res: Response) => {
  try {
    const { persistentId } = req.params;
    const { files } = req.body;

    if (!files || !Array.isArray(files)) {
      return res.status(400).json({
        error: 'Files array is required',
        code: 'MISSING_FILES'
      });
    }

    await dataverseAPI.uploadFiles(persistentId, files);

    res.json({
      success: true,
      persistentId,
      filesUploaded: files.length,
      message: 'Files uploaded to Dataverse successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dataverse upload error:', error);
    res.status(500).json({
      error: 'Failed to upload files to Dataverse',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/dataverse/publish/:persistentId
 * Publish dataset
 */
router.post('/publish/:persistentId', async (req: Request, res: Response) => {
  try {
    const { persistentId } = req.params;
    const { type = 'major' } = req.body;

    await dataverseAPI.publishDataset(persistentId, type);

    res.json({
      success: true,
      persistentId,
      publishType: type,
      message: 'Dataset published on Dataverse successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dataverse publish error:', error);
    res.status(500).json({
      error: 'Failed to publish dataset on Dataverse',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/dataverse/link-did
 * Link DID to dataset
 */
router.post('/link-did', async (req: Request, res: Response) => {
  try {
    const { persistentId, didId, cidHash, metadata } = req.body;

    if (!persistentId || !didId) {
      return res.status(400).json({
        error: 'persistentId and didId are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    await dataverseAPI.linkDIDToDataset(persistentId, didId, cidHash);

    res.json({
      success: true,
      link: {
        persistentId,
        didId,
        cidHash,
        metadata: metadata || {},
        linkedAt: new Date().toISOString()
      },
      message: 'DID linked to dataset successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dataverse DID linking error:', error);
    res.status(500).json({
      error: 'Failed to link DID to dataset',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/dataverse/files/:persistentId
 * Get dataset files
 */
router.get('/files/:persistentId', async (req: Request, res: Response) => {
  try {
    const { persistentId } = req.params;

    const files = await dataverseAPI.getDatasetFiles(persistentId);

    res.json({
      success: true,
      persistentId,
      files: files.map((file: any) => ({
        id: file.dataFile.id,
        filename: file.dataFile.filename,
        contentType: file.dataFile.contentType,
        filesize: file.dataFile.filesize,
        storageIdentifier: file.dataFile.storageIdentifier,
        description: file.description,
        categories: file.categories,
        downloadUrl: `${process.env.DATAVERSE_API_URL || 'https://demo.dataverse.org'}/api/access/datafile/${file.dataFile.id}`
      })),
      count: files.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dataverse files retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve files from dataset',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/dataverse/recent
 * Get recent datasets
 */
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const { limit = '20' } = req.query;

    const results = await dataverseAPI.getRecentDatasets(parseInt(limit as string));

    res.json({
      success: true,
      datasets: results.data.items?.map((item: any) => ({
        id: item.global_id,
        persistentId: item.global_id,
        title: item.name,
        description: item.description,
        authors: item.authors,
        published_at: item.published_at,
        type: item.type,
        url: item.url
      })) || [],
      total: results.data.total_count,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dataverse recent datasets error:', error);
    res.status(500).json({
      error: 'Failed to retrieve recent datasets',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/dataverse/health
 * Health check for Dataverse service
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const isConnected = await dataverseAPI.testConnection();

    res.json({
      service: 'Dataverse Integration',
      status: isConnected ? 'healthy' : 'unhealthy',
      connected: isConnected,
      apiUrl: process.env.DATAVERSE_API_URL || 'https://demo.dataverse.org',
      capabilities: [
        'create',
        'search',
        'retrieve',
        'upload',
        'publish',
        'link-did',
        'files'
      ],
      features: {
        doiAssignment: true,
        persistentIdentifiers: true,
        fileStorage: true,
        metadataHarvesting: true,
        culturalHeritage: true,
        academicRepository: true
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(503).json({
      service: 'Dataverse Integration',
      status: 'unhealthy',
      error: 'Cannot connect to Dataverse',
      timestamp: new Date().toISOString()
    });
  }
});

export { router as dataverseRoutes };
