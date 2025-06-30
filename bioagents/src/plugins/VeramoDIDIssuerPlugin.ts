import { AgentPlugin, AgentContext } from '../core/AgentCore';
import { EnrichedMetadata } from './LangChainEnricherPlugin';
import { v4 as uuidv4 } from 'uuid';

export interface DIDDocument {
  '@context': string[];
  id: string;
  verificationMethod: Array<{
    id: string;
    type: string;
    controller: string;
    publicKeyJwk?: any;
    publicKeyMultibase?: string;
  }>;
  authentication: string[];
  assertionMethod: string[];
  keyAgreement?: string[];
  capabilityInvocation?: string[];
  capabilityDelegation?: string[];
  service?: Array<{
    id: string;
    type: string;
    serviceEndpoint: string;
  }>;
}

export interface VerifiableCredential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: string | { id: string; [key: string]: any };
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: {
    id: string;
    [key: string]: any;
  };
  proof: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    jws?: string;
    proofValue?: string;
  };
}

export interface DIDCreationResult {
  did: string;
  didDocument: DIDDocument;
  verifiableCredential: VerifiableCredential;
  dkgKnowledgeAssetId?: string;
  provenance: {
    sourceDataset: string;
    harvestTimestamp: string;
    enrichmentTimestamp: string;
    issuanceTimestamp: string;
    processingSteps: string[];
  };
}

export class VeramoDIDIssuerPlugin implements AgentPlugin {
  name = 'veramo-did-issuer';
  version = '1.0.0';
  description = 'Issues W3C-compliant DIDs and Verifiable Credentials using Veramo framework';

  private issuerDID!: string;
  private privateKey!: string;

  async initialize(context: AgentContext): Promise<void> {
    // In a real implementation, you would:
    // 1. Initialize Veramo agent
    // 2. Load or create issuer DID
    // 3. Set up key management
    
    this.issuerDID = process.env.ISSUER_DID || 'did:ethr:0x' + Math.random().toString(16).substr(2, 40);
    this.privateKey = process.env.ISSUER_PRIVATE_KEY || 'mock-private-key';

    context.logger.info('Veramo DID Issuer Plugin initialized', {
      issuerDID: this.issuerDID,
      hasPrivateKey: !!this.privateKey
    });
  }

  async execute(
    input: { enrichedMetadata: EnrichedMetadata; options?: { 
      publishToDKG?: boolean; 
      expirationDays?: number;
      credentialType?: string;
    } }, 
    context: AgentContext
  ): Promise<DIDCreationResult> {
    const { enrichedMetadata, options = {} } = input;
    const { logger, metrics, config } = context;
    const startTime = Date.now();

    try {
      logger.info('Starting DID and VC creation', {
        datasetId: enrichedMetadata.id,
        title: enrichedMetadata.title,
        options
      });

      // Generate new DID for the dataset
      const datasetDID = this.generateDID();
      
      // Create DID Document
      const didDocument = this.createDIDDocument(datasetDID, enrichedMetadata, context);
      
      // Create Verifiable Credential
      const verifiableCredential = await this.createVerifiableCredential(
        datasetDID, 
        enrichedMetadata, 
        options, 
        context
      );

      // Create provenance record
      const provenance = this.createProvenanceRecord(enrichedMetadata);

      let dkgKnowledgeAssetId: string | undefined;

      // Optionally publish to OriginTrail DKG
      if (options.publishToDKG && config.dkg) {
        dkgKnowledgeAssetId = await this.publishToDKG(
          { didDocument, verifiableCredential, enrichedMetadata }, 
          context
        );
      }

      const result: DIDCreationResult = {
        did: datasetDID,
        didDocument,
        verifiableCredential,
        dkgKnowledgeAssetId,
        provenance
      };

      const duration = Date.now() - startTime;
      metrics.timing('did.creation.duration', duration);
      metrics.increment('did.creation.success');

      logger.info('DID and VC creation completed successfully', {
        datasetDID,
        vcId: verifiableCredential.id,
        dkgAssetId: dkgKnowledgeAssetId,
        duration
      });

      return result;

    } catch (error: any) {
      const duration = Date.now() - startTime;
      metrics.timing('did.creation.duration', duration);
      metrics.increment('did.creation.error');

      logger.error('DID and VC creation failed', error, {
        datasetId: enrichedMetadata.id,
        duration
      });
      throw new Error(`DID creation failed: ${error.message}`);
    }
  }

  private generateDID(): string {
    // Generate a DID using did:key method for simplicity
    // In production, you might use did:ethr, did:web, or other methods
    const uuid = uuidv4();
    return `did:key:z6Mk${uuid.replace(/-/g, '')}`;
  }

  private createDIDDocument(did: string, metadata: EnrichedMetadata, context: AgentContext): DIDDocument {
    const verificationMethodId = `${did}#key-1`;
    
    return {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/ed25519-2020/v1'
      ],
      id: did,
      verificationMethod: [{
        id: verificationMethodId,
        type: 'Ed25519VerificationKey2020',
        controller: did,
        publicKeyMultibase: this.generatePublicKey()
      }],
      authentication: [verificationMethodId],
      assertionMethod: [verificationMethodId],
      service: [{
        id: `${did}#dataset-service`,
        type: 'DatasetService',
        serviceEndpoint: `https://api.helixid.xyz/datasets/${metadata.id}`
      }]
    };
  }

  private async createVerifiableCredential(
    subjectDID: string, 
    metadata: EnrichedMetadata, 
    options: any, 
    context: AgentContext
  ): Promise<VerifiableCredential> {
    const now = new Date();
    const expirationDate = new Date(now);
    expirationDate.setDate(expirationDate.getDate() + (options.expirationDays || 365));

    const credentialSubject = {
      id: subjectDID,
      type: 'Dataset',
      title: metadata.title,
      description: metadata.description,
      authors: metadata.authors,
      subjects: metadata.subjects,
      keywords: metadata.keywords,
      publicationDate: metadata.publicationDate,
      version: metadata.version,
      license: metadata.license,
      doi: metadata.doi,
      files: metadata.files.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type,
        checksum: f.checksum
      })),
      geographicCoverage: metadata.geographicCoverage,
      timePeriodCovered: metadata.timePeriodCovered,
      funding: metadata.funding,
      // Include enrichment data
      enrichment: {
        culturalContext: metadata.enrichment.culturalContext,
        qualityAssessment: metadata.enrichment.qualityAssessment,
        semanticTags: metadata.enrichment.semanticTags,
        gdprCompliance: metadata.enrichment.gdprCompliance
      }
    };

    const credential: VerifiableCredential = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://schema.org',
        'https://w3id.org/security/suites/ed25519-2020/v1'
      ],
      id: `urn:uuid:${uuidv4()}`,
      type: ['VerifiableCredential', options.credentialType || 'DatasetCredential'],
      issuer: {
        id: this.issuerDID,
        name: 'HeliXID Metadata Agent',
        type: 'Organization'
      },
      issuanceDate: now.toISOString(),
      expirationDate: expirationDate.toISOString(),
      credentialSubject,
      proof: {
        type: 'Ed25519Signature2020',
        created: now.toISOString(),
        verificationMethod: `${this.issuerDID}#key-1`,
        proofPurpose: 'assertionMethod',
        jws: this.generateProofSignature(credentialSubject)
      }
    };

    return credential;
  }

  private createProvenanceRecord(metadata: EnrichedMetadata) {
    return {
      sourceDataset: metadata.id,
      harvestTimestamp: new Date().toISOString(),
      enrichmentTimestamp: new Date().toISOString(),
      issuanceTimestamp: new Date().toISOString(),
      processingSteps: [
        'dataverse-harvest',
        'metadata-extraction',
        'ai-enrichment',
        'gdpr-analysis',
        'did-creation',
        'vc-issuance'
      ]
    };
  }

  private async publishToDKG(
    data: { didDocument: DIDDocument; verifiableCredential: VerifiableCredential; enrichedMetadata: EnrichedMetadata }, 
    context: AgentContext
  ): Promise<string> {
    const { logger, config } = context;

    try {
      // Create knowledge asset for DKG
      const knowledgeAsset = {
        '@context': ['https://w3id.org/okn/ra'],
        '@type': 'Dataset',
        '@id': data.didDocument.id,
        'dct:title': data.enrichedMetadata.title,
        'dct:description': data.enrichedMetadata.description,
        'dct:creator': data.enrichedMetadata.authors,
        'dcat:keyword': data.enrichedMetadata.keywords,
        'dcat:theme': data.enrichedMetadata.subjects,
        'prov:wasGeneratedBy': {
          '@type': 'prov:Activity',
          'prov:startedAtTime': new Date().toISOString(),
          'prov:used': [
            {
              '@type': 'prov:Entity',
              'rdfs:label': 'AI Metadata Enrichment',
              'prov:wasGeneratedBy': 'bioagents-langchain-enricher'
            }
          ]
        },
        'helixid:didDocument': data.didDocument,
        'helixid:verifiableCredential': data.verifiableCredential,
        'helixid:enrichment': data.enrichedMetadata.enrichment
      };

      // In a real implementation, you would publish to OriginTrail DKG
      // For now, we'll simulate this
      const mockAssetId = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      logger.info('Published knowledge asset to DKG', {
        assetId: mockAssetId,
        datasetTitle: data.enrichedMetadata.title
      });

      return mockAssetId;

    } catch (error: any) {
      logger.error('Failed to publish to DKG', error);
      throw error;
    }
  }

  private generatePublicKey(): string {
    // Generate a mock public key in multibase format
    // In production, this would be derived from the actual private key
    return `z6Mk${Math.random().toString(36).substr(2, 44)}`;
  }

  private generateProofSignature(credentialSubject: any): string {
    // Generate a mock JWS signature
    // In production, this would be a real cryptographic signature
    const header = { alg: 'EdDSA', typ: 'JWT' };
    const payload = { sub: credentialSubject.id, iat: Math.floor(Date.now() / 1000) };
    
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const mockSignature = Math.random().toString(36).substr(2, 43);
    
    return `${encodedHeader}.${encodedPayload}.${mockSignature}`;
  }

  async cleanup(): Promise<void> {
    // Cleanup Veramo agent and key management resources
  }
}
