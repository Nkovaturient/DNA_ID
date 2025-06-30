import axios, { AxiosInstance } from 'axios';
import { DID, Dataset, ProvenanceRecord, KnowledgeAsset } from '../types';

export interface DKGNode {
  endpoint: string;
  port: number;
  blockchain: {
    name: string;
    publicKey: string;
  };
}

export interface KnowledgeGraphAsset {
  UAL: string; // Universal Asset Locator
  public: {
    '@context': string | object;
    '@id': string;
    '@type': string;
    [key: string]: any;
  };
  private?: {
    [key: string]: any;
  };
  immutable?: {
    [key: string]: any;
  };
}

export interface ProvenanceAssertion {
  '@context': {
    [key: string]: string;
  };
  '@graph': ProvenanceTriple[];
}

export interface ProvenanceTriple {
  '@id': string;
  '@type': string;
  [predicate: string]: any;
}

export class OriginTrailDKG {
  private client: AxiosInstance;
  private nodeEndpoint: string;
  private environment: 'testnet' | 'mainnet';
  private apiKey: string;

  constructor() {
    this.nodeEndpoint = import.meta.env.VITE_ORIGINTRAIL_NODE_URL || 'https://node-testnet.origin-trail.network';
    this.environment = (import.meta.env.VITE_ORIGINTRAIL_ENVIRONMENT as 'testnet' | 'mainnet') || 'testnet';
    this.apiKey = import.meta.env.VITE_ORIGINTRAIL_API_KEY || '';

    this.client = axios.create({
      baseURL: this.nodeEndpoint,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[OriginTrail DKG] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[OriginTrail DKG Error]:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Test connection to OriginTrail DKG node
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/info');
      console.log('[OriginTrail DKG] Connection successful:', response.data);
      return true;
    } catch (error) {
      console.error('[OriginTrail DKG] Connection failed:', error);
      return false;
    }
  }

  /**
   * Create a knowledge asset in the DKG
   */
  async createKnowledgeAsset(
    did: DID,
    dataset?: Dataset,
    metadata?: any
  ): Promise<KnowledgeGraphAsset> {
    try {
      // Create semantic data following JSON-LD format
      const semanticData = {
        '@context': {
          '@vocab': 'https://schema.org/',
          'dna': 'https://dna-id.org/vocab/',
          'did': 'https://www.w3.org/ns/did/v1',
          'vc': 'https://www.w3.org/2018/credentials/v1',
          'prov': 'http://www.w3.org/ns/prov#'
        },
        '@id': did.id,
        '@type': ['CreativeWork', 'Dataset', 'dna:DecentralizedIdentifier'],
        'name': did.metadata.name,
        'description': did.metadata.description,
        'identifier': did.id,
        'creator': {
          '@type': 'Organization',
          'name': 'DNA_ID System'
        },
        'dateCreated': did.created.toISOString(),
        'keywords': did.metadata.tags,
        'dna:didMethod': did.method,
        'dna:status': did.status,
        'dna:culturalHeritage': did.metadata.culturalHeritage,
        'dna:gdprConsent': {
          '@type': 'dna:GDPRConsent',
          'granted': did.gdprConsent.granted,
          'timestamp': did.gdprConsent.timestamp.toISOString(),
          'purposes': did.gdprConsent.purposes
        },
        'dna:storage': {
          '@type': 'dna:DecentralizedStorage',
          'ipfsHash': did.storage.ipfsHash,
          'filecoinDeal': did.storage.filecoinDeal
        },
        'dna:verifiableCredentials': did.verifiableCredentials?.map(vc => ({
          '@type': 'VerifiableCredential',
          'credentialSubject': vc.credentialSubject,
          'issuer': vc.issuer,
          'issuanceDate': vc.issuanceDate
        })) || []
      };

      // Add dataset information if provided
      if (dataset) {
        semanticData['dna:linkedDataset'] = {
          '@type': 'Dataset',
          '@id': dataset.persistentId,
          'identifier': dataset.persistentId,
          'name': dataset.metadataBlocks?.citation?.fields?.find(f => f.typeName === 'title')?.value,
          'description': dataset.metadataBlocks?.citation?.fields?.find(f => f.typeName === 'dsDescription')?.value?.[0]?.dsDescriptionValue?.value,
          'url': `${import.meta.env.VITE_DATAVERSE_API_URL}/dataset.xhtml?persistentId=${dataset.persistentId}`
        };
      }

      // Add custom metadata if provided
      if (metadata) {
        Object.assign(semanticData, metadata);
      }

      console.log('[OriginTrail DKG] Creating knowledge asset:', JSON.stringify(semanticData, null, 2));

      const response = await this.client.post('/publish', {
        public: semanticData,
        options: {
          epochsNum: 5, // Number of epochs to store
          maxNumberOfRetries: 3,
          frequency: 1,
          contentType: 'all' // public, private, or all
        }
      });

      console.log('[OriginTrail DKG] Knowledge asset created:', response.data);

      return {
        UAL: response.data.UAL,
        public: semanticData
      };
    } catch (error) {
      console.error('[OriginTrail DKG] Knowledge asset creation failed:', error);
      throw error;
    }
  }

  /**
   * Create provenance record linking DID, dataset, and operations
   */
  async createProvenanceRecord(
    sourceUAL: string,
    targetUAL: string,
    operation: string,
    agent: string,
    metadata?: any
  ): Promise<string> {
    try {
      const provenanceData = {
        '@context': {
          'prov': 'http://www.w3.org/ns/prov#',
          'dna': 'https://dna-id.org/vocab/',
          'xsd': 'http://www.w3.org/2001/XMLSchema#'
        },
        '@graph': [
          {
            '@id': `urn:provenance:${Date.now()}`,
            '@type': 'prov:Activity',
            'prov:startedAtTime': {
              '@type': 'xsd:dateTime',
              '@value': new Date().toISOString()
            },
            'prov:endedAtTime': {
              '@type': 'xsd:dateTime',
              '@value': new Date().toISOString()
            },
            'prov:wasAssociatedWith': {
              '@id': agent,
              '@type': 'prov:Agent'
            },
            'dna:operation': operation,
            'prov:used': {
              '@id': sourceUAL
            },
            'prov:generated': {
              '@id': targetUAL
            }
          }
        ]
      };

      // Add custom metadata
      if (metadata) {
        provenanceData['@graph'][0] = { ...provenanceData['@graph'][0], ...metadata };
      }

      console.log('[OriginTrail DKG] Creating provenance record:', JSON.stringify(provenanceData, null, 2));

      const response = await this.client.post('/publish', {
        public: provenanceData,
        options: {
          epochsNum: 10, // Store provenance longer
          maxNumberOfRetries: 3,
          frequency: 1
        }
      });

      console.log('[OriginTrail DKG] Provenance record created:', response.data);
      return response.data.UAL;
    } catch (error) {
      console.error('[OriginTrail DKG] Provenance record creation failed:', error);
      throw error;
    }
  }

  /**
   * Query knowledge graph using SPARQL-like queries
   */
  async queryKnowledgeGraph(
    query: string,
    graphType: 'public' | 'private' = 'public'
  ): Promise<any> {
    try {
      const response = await this.client.post('/query', {
        query,
        type: graphType,
        repository: 'DKG'
      });

      return response.data;
    } catch (error) {
      console.error('[OriginTrail DKG] Query failed:', error);
      throw error;
    }
  }

  /**
   * Get knowledge asset by UAL
   */
  async getKnowledgeAsset(ual: string): Promise<KnowledgeGraphAsset | null> {
    try {
      const response = await this.client.get(`/get/${ual}`);
      return response.data;
    } catch (error) {
      console.error('[OriginTrail DKG] Asset retrieval failed:', error);
      return null;
    }
  }

  /**
   * Search for DIDs by criteria
   */
  async searchDIDs(
    criteria: {
      type?: string;
      culturalHeritage?: boolean;
      tags?: string[];
      dateRange?: { from: Date; to: Date };
    }
  ): Promise<KnowledgeGraphAsset[]> {
    try {
      let query = `
        PREFIX dna: <https://dna-id.org/vocab/>
        PREFIX schema: <https://schema.org/>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        
        SELECT ?did ?name ?description ?created ?status WHERE {
          ?did rdf:type dna:DecentralizedIdentifier .
          ?did schema:name ?name .
          ?did schema:description ?description .
          ?did schema:dateCreated ?created .
          ?did dna:status ?status .
      `;

      // Add filters based on criteria
      if (criteria.type) {
        query += `\n          ?did rdf:type schema:${criteria.type} .`;
      }

      if (criteria.culturalHeritage !== undefined) {
        query += `\n          ?did dna:culturalHeritage ${criteria.culturalHeritage} .`;
      }

      if (criteria.tags && criteria.tags.length > 0) {
        query += `\n          ?did schema:keywords ?keywords .`;
        criteria.tags.forEach(tag => {
          query += `\n          FILTER(CONTAINS(LCASE(?keywords), "${tag.toLowerCase()}"))`;
        });
      }

      if (criteria.dateRange) {
        query += `\n          FILTER(?created >= "${criteria.dateRange.from.toISOString()}"^^xsd:dateTime)`;
        query += `\n          FILTER(?created <= "${criteria.dateRange.to.toISOString()}"^^xsd:dateTime)`;
      }

      query += `\n        }`;

      const results = await this.queryKnowledgeGraph(query);
      return results.bindings || [];
    } catch (error) {
      console.error('[OriginTrail DKG] DID search failed:', error);
      return [];
    }
  }

  /**
   * Get provenance chain for a DID
   */
  async getProvenanceChain(didId: string): Promise<ProvenanceRecord[]> {
    try {
      const query = `
        PREFIX prov: <http://www.w3.org/ns/prov#>
        PREFIX dna: <https://dna-id.org/vocab/>
        
        SELECT ?activity ?operation ?agent ?startTime ?endTime ?used ?generated WHERE {
          {
            ?activity prov:used <${didId}> .
          } UNION {
            ?activity prov:generated <${didId}> .
          }
          ?activity rdf:type prov:Activity .
          OPTIONAL { ?activity dna:operation ?operation . }
          OPTIONAL { ?activity prov:wasAssociatedWith ?agent . }
          OPTIONAL { ?activity prov:startedAtTime ?startTime . }
          OPTIONAL { ?activity prov:endedAtTime ?endTime . }
          OPTIONAL { ?activity prov:used ?used . }
          OPTIONAL { ?activity prov:generated ?generated . }
        }
        ORDER BY DESC(?startTime)
      `;

      const results = await this.queryKnowledgeGraph(query);
      return results.bindings || [];
    } catch (error) {
      console.error('[OriginTrail DKG] Provenance chain retrieval failed:', error);
      return [];
    }
  }

  /**
   * Create relationship between entities
   */
  async createRelationship(
    sourceUAL: string,
    targetUAL: string,
    relationshipType: string,
    metadata?: any
  ): Promise<string> {
    try {
      const relationshipData = {
        '@context': {
          'dna': 'https://dna-id.org/vocab/',
          'schema': 'https://schema.org/',
          'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
        },
        '@id': `urn:relationship:${Date.now()}`,
        '@type': 'dna:Relationship',
        'dna:source': {
          '@id': sourceUAL
        },
        'dna:target': {
          '@id': targetUAL
        },
        'dna:relationshipType': relationshipType,
        'schema:dateCreated': new Date().toISOString(),
        ...metadata
      };

      const response = await this.client.post('/publish', {
        public: relationshipData,
        options: {
          epochsNum: 5,
          maxNumberOfRetries: 3,
          frequency: 1
        }
      });

      console.log('[OriginTrail DKG] Relationship created:', response.data);
      return response.data.UAL;
    } catch (error) {
      console.error('[OriginTrail DKG] Relationship creation failed:', error);
      throw error;
    }
  }

  /**
   * Get network statistics
   */
  async getNetworkStats(): Promise<any> {
    try {
      const response = await this.client.get('/network/get-stats');
      return response.data;
    } catch (error) {
      console.error('[OriginTrail DKG] Network stats retrieval failed:', error);
      return null;
    }
  }

  /**
   * Update knowledge asset
   */
  async updateKnowledgeAsset(
    ual: string,
    updatedData: any,
    updateType: 'append' | 'replace' = 'append'
  ): Promise<string> {
    try {
      const response = await this.client.post('/update', {
        ual,
        public: updatedData,
        options: {
          epochsNum: 5,
          maxNumberOfRetries: 3,
          frequency: 1,
          updateType
        }
      });

      console.log('[OriginTrail DKG] Knowledge asset updated:', response.data);
      return response.data.UAL;
    } catch (error) {
      console.error('[OriginTrail DKG] Knowledge asset update failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const originTrailDKG = new OriginTrailDKG();

// Legacy export for backward compatibility
export const DKGClient = OriginTrailDKG;
