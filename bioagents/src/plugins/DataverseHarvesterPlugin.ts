import { AgentPlugin, AgentContext } from '../core/AgentCore';
import axios from 'axios';

export interface DataverseConfig {
  apiUrl: string;
  apiKey?: string;
  version?: string;
}

export interface DatasetMetadata {
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
  citations?: string[];
  funding?: Array<{
    agency: string;
    grant: string;
  }>;
  geographicCoverage?: {
    country?: string;
    state?: string;
    city?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  timePeriodCovered?: {
    start: string;
    end: string;
  };
}

export class DataverseHarvesterPlugin implements AgentPlugin {
  name = 'dataverse-harvester';
  version = '1.0.0';
  description = 'Harvests metadata and files from Dataverse repositories';

  private config!: DataverseConfig;

  async initialize(context: AgentContext): Promise<void> {
    if (!context.config.dataverse) {
      throw new Error('Dataverse configuration is required');
    }
    
    this.config = {
      apiUrl: context.config.dataverse.apiUrl,
      apiKey: context.config.dataverse.apiKey,
      version: '1'
    };

    context.logger.info('Dataverse Harvester Plugin initialized', {
      apiUrl: this.config.apiUrl,
      hasApiKey: !!this.config.apiKey
    });
  }

  async execute(input: { datasetId?: string; doi?: string; persistentId?: string }, context: AgentContext): Promise<DatasetMetadata> {
    const { logger, metrics } = context;
    const startTime = Date.now();

    try {
      logger.info('Starting Dataverse harvest', { input });

      // Determine the dataset identifier
      let datasetEndpoint: string;
      if (input.doi) {
        datasetEndpoint = `${this.config.apiUrl}/api/datasets/:persistentId/?persistentId=doi:${input.doi}`;
      } else if (input.persistentId) {
        datasetEndpoint = `${this.config.apiUrl}/api/datasets/:persistentId/?persistentId=${input.persistentId}`;
      } else if (input.datasetId) {
        datasetEndpoint = `${this.config.apiUrl}/api/datasets/${input.datasetId}`;
      } else {
        throw new Error('Either datasetId, doi, or persistentId must be provided');
      }

      // Fetch dataset metadata
      const headers: any = {
        'Content-Type': 'application/json'
      };
      if (this.config.apiKey) {
        headers['X-Dataverse-key'] = this.config.apiKey;
      }

      logger.debug('Fetching dataset metadata', { endpoint: datasetEndpoint });
      
      const datasetResponse = await axios.get(datasetEndpoint, { headers });
      const dataset = datasetResponse.data.data;

      // Extract and structure metadata
      const metadata = this.extractMetadata(dataset, logger);

      // Fetch file information
      const filesEndpoint = input.doi 
        ? `${this.config.apiUrl}/api/datasets/:persistentId/versions/:latest/files?persistentId=doi:${input.doi}`
        : `${this.config.apiUrl}/api/datasets/${input.datasetId}/versions/:latest/files`;

      logger.debug('Fetching file information', { endpoint: filesEndpoint });
      
      const filesResponse = await axios.get(filesEndpoint, { headers });
      const files = this.extractFileInfo(filesResponse.data.data, logger);

      const result: DatasetMetadata = {
        ...metadata,
        files
      };

      const duration = Date.now() - startTime;
      metrics.timing('dataverse.harvest.duration', duration);
      metrics.increment('dataverse.harvest.success');

      logger.info('Dataverse harvest completed successfully', {
        datasetId: result.id,
        title: result.title,
        fileCount: result.files.length,
        duration
      });

      return result;

    } catch (error: any) {
      const duration = Date.now() - startTime;
      metrics.timing('dataverse.harvest.duration', duration);
      metrics.increment('dataverse.harvest.error');

      logger.error('Dataverse harvest failed', error, { input, duration });
      throw new Error(`Dataverse harvest failed: ${error.message}`);
    }
  }

  private extractMetadata(dataset: any, logger: any): Omit<DatasetMetadata, 'files'> {
    const latestVersion = dataset.latestVersion || dataset;
    const metadataBlocks = latestVersion.metadataBlocks || {};
    const citation = metadataBlocks.citation?.fields || [];

    logger.debug('Extracting metadata from dataset', { 
      id: dataset.id, 
      version: latestVersion.versionNumber 
    });

    // Helper function to find field by typeName
    const findField = (typeName: string) => {
      return citation.find((field: any) => field.typeName === typeName);
    };

    // Extract basic metadata
    const title = findField('title')?.value || 'Untitled Dataset';
    const description = findField('dsDescription')?.value?.[0]?.dsDescriptionValue?.value || '';
    const subjects = findField('subject')?.value || [];
    const keywords = findField('keyword')?.value?.map((k: any) => k.keywordValue?.value).filter(Boolean) || [];

    // Extract authors
    const authorsField = findField('author');
    const authors = authorsField?.value?.map((author: any) => ({
      name: author.authorName?.value || '',
      affiliation: author.authorAffiliation?.value || undefined,
      orcid: author.authorIdentifier?.value || undefined
    })) || [];

    // Extract publication info
    const publicationDate = findField('productionDate')?.value || 
                           findField('distributionDate')?.value || 
                           latestVersion.releaseTime || 
                           new Date().toISOString();

    // Extract other metadata
    const license = latestVersion.license?.name || undefined;
    const doi = dataset.protocol && dataset.authority && dataset.identifier 
      ? `${dataset.protocol}:${dataset.authority}/${dataset.identifier}`
      : undefined;

    // Extract geographic coverage
    const geographicCoverage = this.extractGeographicCoverage(metadataBlocks);

    // Extract time period
    const timePeriodCovered = this.extractTimePeriod(metadataBlocks);

    // Extract funding information
    const funding = this.extractFunding(metadataBlocks);

    return {
      id: dataset.id.toString(),
      title,
      description,
      authors,
      subjects,
      keywords,
      publicationDate,
      version: `${latestVersion.versionNumber}.${latestVersion.versionMinorNumber}`,
      license,
      doi,
      geographicCoverage,
      timePeriodCovered,
      funding
    };
  }

  private extractFileInfo(files: any[], logger: any): DatasetMetadata['files'] {
    logger.debug('Extracting file information', { fileCount: files.length });

    return files.map(file => ({
      name: file.dataFile?.filename || file.filename || 'unknown',
      size: file.dataFile?.filesize || file.filesize || 0,
      type: file.dataFile?.contentType || file.contentType || 'application/octet-stream',
      checksum: file.dataFile?.checksum?.value || file.checksum || ''
    }));
  }

  private extractGeographicCoverage(metadataBlocks: any): DatasetMetadata['geographicCoverage'] | undefined {
    const geospatial = metadataBlocks.geospatial?.fields || [];
    const geographicCoverageField = geospatial.find((field: any) => field.typeName === 'geographicCoverage');
    
    if (!geographicCoverageField?.value?.length) return undefined;

    const coverage = geographicCoverageField.value[0];
    return {
      country: coverage.country?.value,
      state: coverage.state?.value,
      city: coverage.city?.value,
      coordinates: coverage.westLongitude && coverage.northLatitude ? {
        lat: parseFloat(coverage.northLatitude.value),
        lng: parseFloat(coverage.westLongitude.value)
      } : undefined
    };
  }

  private extractTimePeriod(metadataBlocks: any): DatasetMetadata['timePeriodCovered'] | undefined {
    const citation = metadataBlocks.citation?.fields || [];
    const timePeriodField = citation.find((field: any) => field.typeName === 'timePeriodCovered');
    
    if (!timePeriodField?.value?.length) return undefined;

    const period = timePeriodField.value[0];
    return {
      start: period.timePeriodCoveredStart?.value,
      end: period.timePeriodCoveredEnd?.value
    };
  }

  private extractFunding(metadataBlocks: any): DatasetMetadata['funding'] | undefined {
    const citation = metadataBlocks.citation?.fields || [];
    const grantField = citation.find((field: any) => field.typeName === 'grantNumber');
    
    if (!grantField?.value?.length) return undefined;

    return grantField.value.map((grant: any) => ({
      agency: grant.grantNumberAgency?.value || 'Unknown Agency',
      grant: grant.grantNumberValue?.value || ''
    }));
  }

  async cleanup(): Promise<void> {
    // No specific cleanup required for this plugin
  }
}
