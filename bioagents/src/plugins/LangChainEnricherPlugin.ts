import { AgentPlugin, AgentContext } from '../core/AgentCore';
import { ChatOpenAI, AzureChatOpenAI} from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { DatasetMetadata } from './DataverseHarvesterPlugin';

export interface EnrichmentOptions {
  culturalContext?: boolean;
  multilingualProcessing?: boolean;
  gdprCompliance?: boolean;
  sensitivityCheck?: boolean;
  qualityAssessment?: boolean;
}

export interface EnrichedMetadata extends DatasetMetadata {
  enrichment: {
    culturalContext?: {
      significance: string;
      culturalCategories: string[];
      communityRelevance: string;
      historicalImportance: string;
      sensitivePractices: string[];
    };
    qualityAssessment?: {
      completenessScore: number;
      consistencyScore: number;
      accuracyScore: number;
      recommendations: string[];
    };
    semanticTags?: {
      entities: Array<{
        text: string;
        type: string;
        confidence: number;
      }>;
      concepts: string[];
      themes: string[];
    };
    gdprCompliance?: {
      personalDataDetected: boolean;
      personalDataTypes: string[];
      processingPurposes: string[];
      legalBasis: string;
      retentionPeriod: string;
      risks: string[];
      recommendations: string[];
    };
    translations?: {
      [languageCode: string]: {
        title: string;
        description: string;
        keywords: string[];
      };
    };
  };
}

export class LangChainEnricherPlugin implements AgentPlugin {
  name = 'langchain-enricher';
  version = '1.0.0';
  description = 'AI-powered metadata enrichment using LangChain and various LLM providers';

  private llm!: ChatOpenAI | AzureChatOpenAI;

  async initialize(context: AgentContext): Promise<void> {
    if (!context.config.llm) {
      throw new Error('LLM configuration is required');
    }

    const { provider, model, apiKey, endpoint, temperature = 0.3, maxTokens = 2000 } = context.config.llm;

    switch (provider) {
      case 'openai':
        this.llm = new ChatOpenAI({
          modelName: model,
          temperature,
          maxTokens,
          openAIApiKey: apiKey
        });
        break;
      case 'azure':
        this.llm = new AzureChatOpenAI({
          modelName: model,
          temperature,
          maxTokens,
          openAIApiKey: apiKey
        });
        break;
      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }

    context.logger.info('LangChain Enricher Plugin initialized', {
      provider,
      model,
      hasApiKey: !!apiKey
    });
  }

  async execute(
    input: { metadata: DatasetMetadata; options: EnrichmentOptions }, 
    context: AgentContext
  ): Promise<EnrichedMetadata> {
    const { metadata, options } = input;
    const { logger, metrics } = context;
    const startTime = Date.now();

    try {
      logger.info('Starting metadata enrichment', { 
        datasetId: metadata.id, 
        title: metadata.title,
        options 
      });

      const enrichment: EnrichedMetadata['enrichment'] = {};

      // Cultural context enrichment
      if (options.culturalContext) {
        logger.debug('Performing cultural context enrichment');
        enrichment.culturalContext = await this.enrichCulturalContext(metadata, context);
      }

      // Quality assessment
      if (options.qualityAssessment) {
        logger.debug('Performing quality assessment');
        enrichment.qualityAssessment = await this.assessQuality(metadata, context);
      }

      // Semantic tagging
      logger.debug('Performing semantic analysis');
      enrichment.semanticTags = await this.performSemanticAnalysis(metadata, context);

      // GDPR compliance analysis
      if (options.gdprCompliance) {
        logger.debug('Performing GDPR compliance analysis');
        enrichment.gdprCompliance = await this.analyzeGDPRCompliance(metadata, context);
      }

      // Multilingual processing
      if (options.multilingualProcessing) {
        logger.debug('Performing multilingual processing');
        enrichment.translations = await this.generateTranslations(metadata, context);
      }

      const result: EnrichedMetadata = {
        ...metadata,
        enrichment
      };

      const duration = Date.now() - startTime;
      metrics.timing('enricher.total.duration', duration);
      metrics.increment('enricher.success');

      logger.info('Metadata enrichment completed successfully', {
        datasetId: metadata.id,
        enrichmentKeys: Object.keys(enrichment),
        duration
      });

      return result;

    } catch (error: any) {
      const duration = Date.now() - startTime;
      metrics.timing('enricher.total.duration', duration);
      metrics.increment('enricher.error');

      logger.error('Metadata enrichment failed', error, { 
        datasetId: metadata.id, 
        duration 
      });
      throw new Error(`Metadata enrichment failed: ${error.message}`);
    }
  }

  private async enrichCulturalContext(metadata: DatasetMetadata, context: AgentContext) {
    const prompt = `Analyze the following cultural heritage dataset for cultural context and significance:

Title: ${metadata.title}
Description: ${metadata.description}
Subjects: ${metadata.subjects.join(', ')}
Keywords: ${metadata.keywords.join(', ')}
Geographic Coverage: ${JSON.stringify(metadata.geographicCoverage)}

Please provide a detailed analysis including:
1. Cultural significance and importance
2. Relevant cultural categories
3. Community relevance
4. Historical importance
5. Any sensitive cultural practices or considerations

Respond in JSON format with the following structure:
{
  "significance": "string",
  "culturalCategories": ["string"],
  "communityRelevance": "string",
  "historicalImportance": "string",
  "sensitivePractices": ["string"]
}`;

    const messages = [
      new SystemMessage("You are a cultural heritage expert specializing in analyzing datasets for cultural significance and sensitivity."),
      new HumanMessage(prompt)
    ];

    const response = await this.llm.invoke(messages);
    
    try {
      return JSON.parse(response.content as string);
    } catch (error) {
      context.logger.warn('Failed to parse cultural context response, using fallback');
      return {
        significance: response.content as string,
        culturalCategories: [],
        communityRelevance: '',
        historicalImportance: '',
        sensitivePractices: []
      };
    }
  }

  private async assessQuality(metadata: DatasetMetadata, context: AgentContext) {
    const prompt = `Assess the quality of this dataset metadata:

Title: ${metadata.title}
Description: ${metadata.description}
Authors: ${metadata.authors.map(a => a.name).join(', ')}
Subjects: ${metadata.subjects.join(', ')}
Keywords: ${metadata.keywords.join(', ')}
Files: ${metadata.files.length} files
License: ${metadata.license || 'Not specified'}
DOI: ${metadata.doi || 'Not specified'}

Rate the metadata quality on these dimensions (0-100):
1. Completeness - How complete is the metadata?
2. Consistency - How consistent is the information?
3. Accuracy - How accurate does the information appear?

Also provide recommendations for improvement.

Respond in JSON format:
{
  "completenessScore": number,
  "consistencyScore": number,
  "accuracyScore": number,
  "recommendations": ["string"]
}`;

    const messages = [
      new SystemMessage("You are a data quality expert specializing in research dataset metadata assessment."),
      new HumanMessage(prompt)
    ];

    const response = await this.llm.invoke(messages);
    
    try {
      return JSON.parse(response.content as string);
    } catch (error) {
      context.logger.warn('Failed to parse quality assessment response');
      return {
        completenessScore: 50,
        consistencyScore: 50,
        accuracyScore: 50,
        recommendations: ['Unable to assess quality automatically']
      };
    }
  }

  private async performSemanticAnalysis(metadata: DatasetMetadata, context: AgentContext) {
    const prompt = `Perform semantic analysis on this dataset metadata:

Title: ${metadata.title}
Description: ${metadata.description}
Keywords: ${metadata.keywords.join(', ')}

Extract:
1. Named entities (persons, organizations, locations, etc.)
2. Key concepts and themes
3. Research domains and disciplines

Respond in JSON format:
{
  "entities": [{"text": "string", "type": "string", "confidence": number}],
  "concepts": ["string"],
  "themes": ["string"]
}`;

    const messages = [
      new SystemMessage("You are an expert in semantic analysis and natural language processing."),
      new HumanMessage(prompt)
    ];

    const response = await this.llm.invoke(messages);
    
    try {
      return JSON.parse(response.content as string);
    } catch (error) {
      context.logger.warn('Failed to parse semantic analysis response');
      return {
        entities: [],
        concepts: [],
        themes: []
      };
    }
  }

  private async analyzeGDPRCompliance(metadata: DatasetMetadata, context: AgentContext) {
    const prompt = `Analyze this dataset for GDPR compliance considerations:

Title: ${metadata.title}
Description: ${metadata.description}
Subjects: ${metadata.subjects.join(', ')}
Keywords: ${metadata.keywords.join(', ')}
Authors: ${metadata.authors.map(a => `${a.name} (${a.affiliation || 'No affiliation'})`).join(', ')}

Assess:
1. Does this dataset likely contain personal data?
2. What types of personal data might be present?
3. What could be the processing purposes?
4. What would be an appropriate legal basis?
5. What retention period would be appropriate?
6. What are the main GDPR risks?
7. What are your recommendations for compliance?

Respond in JSON format:
{
  "personalDataDetected": boolean,
  "personalDataTypes": ["string"],
  "processingPurposes": ["string"],
  "legalBasis": "string",
  "retentionPeriod": "string",
  "risks": ["string"],
  "recommendations": ["string"]
}`;

    const messages = [
      new SystemMessage("You are a GDPR compliance expert specializing in research data protection."),
      new HumanMessage(prompt)
    ];

    const response = await this.llm.invoke(messages);
    
    try {
      return JSON.parse(response.content as string);
    } catch (error) {
      context.logger.warn('Failed to parse GDPR analysis response');
      return {
        personalDataDetected: false,
        personalDataTypes: [],
        processingPurposes: [],
        legalBasis: 'Unknown',
        retentionPeriod: 'Not specified',
        risks: [],
        recommendations: ['Manual GDPR review recommended']
      };
    }
  }

  private async generateTranslations(metadata: DatasetMetadata, context: AgentContext) {
    const targetLanguages = ['es', 'fr', 'de', 'it', 'pt'];
    const translations: any = {};

    for (const lang of targetLanguages) {
      try {
        const prompt = `Translate the following dataset metadata to ${lang}:

Title: ${metadata.title}
Description: ${metadata.description}
Keywords: ${metadata.keywords.join(', ')}

Provide translations that are culturally appropriate and maintain academic precision.

Respond in JSON format:
{
  "title": "string",
  "description": "string",
  "keywords": ["string"]
}`;

        const messages = [
          new SystemMessage("You are a professional translator specializing in academic and cultural content."),
          new HumanMessage(prompt)
        ];

        const response = await this.llm.invoke(messages);
        translations[lang] = JSON.parse(response.content as string);
        
      } catch (error) {
        context.logger.warn(`Translation failed for language: ${lang}`, error);
      }
    }

    return translations;
  }

  async cleanup(): Promise<void> {
    // No specific cleanup required for this plugin
  }
}
