import { AgentContext } from '../core/AgentCore';

export interface HarvestEnrichIssueInput {
  datasetId?: string;
  doi?: string;
  persistentId?: string;
  enrichmentOptions?: {
    culturalContext?: boolean;
    multilingualProcessing?: boolean;
    gdprCompliance?: boolean;
    sensitivityCheck?: boolean;
    qualityAssessment?: boolean;
  };
  didOptions?: {
    publishToDKG?: boolean;
    expirationDays?: number;
    credentialType?: string;
  };
}

export interface HarvestEnrichIssueResult {
  metadata: any;
  enrichedMetadata: any;
  didResult: any;
  summary: {
    processingTime: number;
    stepsCompleted: string[];
    qualityScore?: number;
    gdprCompliant?: boolean;
    culturalSensitivityFlags?: string[];
  };
}

/**
 * Complete workflow that:
 * 1. Harvests dataset metadata from Dataverse
 * 2. Enriches metadata using AI
 * 3. Issues DID and Verifiable Credential
 * 4. Optionally publishes to OriginTrail DKG
 */
export default async function harvestEnrichIssueWorkflow(
  input: HarvestEnrichIssueInput, 
  context: AgentContext
): Promise<HarvestEnrichIssueResult> {
  const { logger, plugins, addToAuditTrail } = context;
  const startTime = Date.now();
  const stepsCompleted: string[] = [];

  logger.info('Starting harvest-enrich-issue workflow', { input });

  try {
    // Step 1: Harvest metadata from Dataverse
    logger.info('Step 1: Harvesting dataset metadata from Dataverse');
    const harvestStart = Date.now();
    
    const harvesterPlugin = plugins.get('dataverse-harvester');
    if (!harvesterPlugin) {
      throw new Error('Dataverse harvester plugin not found');
    }

    const metadata = await harvesterPlugin.execute({
      datasetId: input.datasetId,
      doi: input.doi,
      persistentId: input.persistentId
    }, context);

    const harvestDuration = Date.now() - harvestStart;
    addToAuditTrail?.('dataverse-harvest', input, metadata, harvestDuration);
    stepsCompleted.push('dataverse-harvest');

    logger.info('Step 1 completed: Dataset metadata harvested', {
      datasetId: metadata?.id,
      title: metadata.title,
      fileCount: metadata.files.length,
      duration: harvestDuration
    });

    // Step 2: Enrich metadata using AI
    logger.info('Step 2: Enriching metadata using AI');
    const enrichStart = Date.now();

    const enricherPlugin = plugins.get('langchain-enricher');
    if (!enricherPlugin) {
      throw new Error('LangChain enricher plugin not found');
    }

    const enrichmentOptions = {
      culturalContext: true,
      multilingualProcessing: false,
      gdprCompliance: true,
      sensitivityCheck: true,
      qualityAssessment: true,
      ...input.enrichmentOptions
    };

    const enrichedMetadata = await enricherPlugin.execute({
      metadata,
      options: enrichmentOptions
    }, context);

    const enrichDuration = Date.now() - enrichStart;
    addToAuditTrail?.('metadata-enrichment', { metadata, options: enrichmentOptions }, enrichedMetadata, enrichDuration);
    stepsCompleted.push('metadata-enrichment');

    logger.info('Step 2 completed: Metadata enriched', {
      datasetId: metadata.id,
      enrichmentKeys: Object.keys(enrichedMetadata.enrichment),
      qualityScore: enrichedMetadata.enrichment.qualityAssessment?.completenessScore,
      duration: enrichDuration
    });

    // Step 3: Issue DID and Verifiable Credential
    logger.info('Step 3: Issuing DID and Verifiable Credential');
    const didStart = Date.now();

    const didIssuerPlugin = plugins.get('veramo-did-issuer');
    if (!didIssuerPlugin) {
      throw new Error('Veramo DID issuer plugin not found');
    }

    const didOptions = {
      publishToDKG: true,
      expirationDays: 365,
      credentialType: 'CulturalHeritageDatasetCredential',
      ...input.didOptions
    };

    const didResult = await didIssuerPlugin.execute({
      enrichedMetadata,
      options: didOptions
    }, context);

    const didDuration = Date.now() - didStart;
    addToAuditTrail?.('did-issuance', { enrichedMetadata, options: didOptions }, didResult, didDuration);
    stepsCompleted.push('did-issuance');

    logger.info('Step 3 completed: DID and VC issued', {
      did: didResult.did,
      vcId: didResult.verifiableCredential.id,
      dkgAssetId: didResult.dkgKnowledgeAssetId,
      duration: didDuration
    });

    // Step 4: Generate summary
    const totalDuration = Date.now() - startTime;
    const summary = {
      processingTime: totalDuration,
      stepsCompleted,
      qualityScore: enrichedMetadata.enrichment.qualityAssessment?.completenessScore,
      gdprCompliant: enrichedMetadata.enrichment.gdprCompliance?.personalDataDetected === false,
      culturalSensitivityFlags: enrichedMetadata.enrichment.culturalContext?.sensitivePractices || []
    };

    const result: HarvestEnrichIssueResult = {
      metadata,
      enrichedMetadata,
      didResult,
      summary
    };

    logger.info('Harvest-enrich-issue workflow completed successfully', {
      datasetId: metadata.id,
      did: didResult.did,
      totalDuration,
      stepsCompleted: stepsCompleted.length
    });

    return result;

  } catch (error: any) {
    const totalDuration = Date.now() - startTime;
    
    logger.error('Harvest-enrich-issue workflow failed', error, {
      input,
      stepsCompleted,
      totalDuration
    });

    // Return partial results if some steps completed
    if (stepsCompleted.length > 0) {
      const summary = {
        processingTime: totalDuration,
        stepsCompleted,
        error: error.message
      };

      // Try to return what we have so far
      const partialResult: any = { summary };
      
      if (stepsCompleted.includes('dataverse-harvest')) {
        // We would need to store intermediate results in context.state
        // For now, we'll just throw the error
      }
    }

    throw error;
  }
}

/**
 * Simplified workflow for testing individual components
 */
export async function testHarvestWorkflow(
  input: { datasetId?: string; doi?: string }, 
  context: AgentContext
) {
  const { logger, plugins } = context;

  logger.info('Running test harvest workflow');

  const harvesterPlugin = plugins.get('dataverse-harvester');
  if (!harvesterPlugin) {
    throw new Error('Dataverse harvester plugin not found');
  }

  return await harvesterPlugin.execute(input, context);
}

/**
 * Simplified workflow for testing enrichment
 */
export async function testEnrichmentWorkflow(
  input: { metadata: any; options?: any }, 
  context: AgentContext
) {
  const { logger, plugins } = context;

  logger.info('Running test enrichment workflow');

  const enricherPlugin = plugins.get('langchain-enricher');
  if (!enricherPlugin) {
    throw new Error('LangChain enricher plugin not found');
  }

  const enrichmentOptions = {
    culturalContext: true,
    gdprCompliance: true,
    qualityAssessment: true,
    ...input.options
  };

  return await enricherPlugin.execute({
    metadata: input.metadata,
    options: enrichmentOptions
  }, context);
}

/**
 * Simplified workflow for testing DID issuance
 */
export async function testDIDIssuanceWorkflow(
  input: { enrichedMetadata: any; options?: any }, 
  context: AgentContext
) {
  const { logger, plugins } = context;

  logger.info('Running test DID issuance workflow');

  const didIssuerPlugin = plugins.get('veramo-did-issuer');
  if (!didIssuerPlugin) {
    throw new Error('Veramo DID issuer plugin not found');
  }

  const didOptions = {
    publishToDKG: false, // Don't publish to DKG in test mode
    expirationDays: 30,
    ...input.options
  };

  return await didIssuerPlugin.execute({
    enrichedMetadata: input.enrichedMetadata,
    options: didOptions
  }, context);
}
