import { 
  createAgent, 
  IDataStore, 
  IDataStoreORM, 
  IKeyManager, 
  ICredentialPlugin,
  IDIDManager,
  IResolver,
  TAgent
} from '@veramo/core';
import { CredentialPlugin } from '@veramo/credential-w3c';
import { DIDResolverPlugin } from '@veramo/did-resolver';
import { DIDManager } from '@veramo/did-manager';
import { EthrDIDProvider } from '@veramo/did-provider-ethr';
import { KeyManager } from '@veramo/key-manager';
import { KeyManagementSystem, SecretBox } from '@veramo/kms-local';
import { Entities, KeyStore, DIDStore, PrivateKeyStore, migrations } from '@veramo/data-store';
import { DataSource } from 'typeorm';
import { Resolver } from 'did-resolver';
import { getResolver as ethrDidResolver } from 'ethr-did-resolver';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

type ConfiguredAgent = TAgent<IDIDManager & IKeyManager & IDataStore & IDataStoreORM & IResolver & ICredentialPlugin>;

export interface DIDCreationOptions {
  method?: 'ethr' | 'key' | 'web';
  network?: 'mainnet' | 'goerli' | 'polygon' | 'local';
  metadata?: any;
  culturalHeritage?: boolean;
  gdprCompliant?: boolean;
}

export interface VerifiableCredentialOptions {
  type: string[];
  expirationDays?: number;
  credentialSubject: any;
  evidence?: any[];
  refreshService?: any;
}

export interface DIDDocument {
  '@context': string[];
  id: string;
  verificationMethod: any[];
  authentication: string[];
  assertionMethod: string[];
  keyAgreement?: string[];
  capabilityInvocation?: string[];
  capabilityDelegation?: string[];
  service?: any[];
  created?: string;
  updated?: string;
}

export interface VerifiableCredential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: string | { id: string; [key: string]: any };
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: any;
  evidence?: any[];
  refreshService?: any;
  proof: any;
}

export interface DIDCreationResult {
  did: string;
  didDocument: DIDDocument;
  verifiableCredential?: VerifiableCredential;
  keys: {
    publicKey: string;
    privateKey: string;
    keyId: string;
  };
  metadata: {
    created: string;
    method: string;
    network: string;
    culturalHeritage: boolean;
    gdprCompliant: boolean;
  };
}

export class VeramoDIDService {
  private agent: ConfiguredAgent | null = null;
  private dbConnection: DataSource | null = null;
  private isInitialized = false;
  private issuerDID: string | null = null;

  /**
   * Initialize Veramo agent with proper configuration
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      console.log('[Veramo] Initializing DID service...');

      // Setup database connection
      this.dbConnection = new DataSource({
        type: 'sqlite',
        database: './data/veramo.db',
        synchronize: true,
        logging: false,
        entities: Entities,
        migrations,
        migrationsRun: true,
      });

      await this.dbConnection.initialize();
      console.log('[Veramo] Database initialized');

      // Setup key management
      const secretKey = process.env.VERAMO_SECRET_KEY || 'your-secret-key-here-change-in-production';
      const kms = new KeyManagementSystem(
        new PrivateKeyStore(this.dbConnection, new SecretBox(secretKey))
      );

      // Setup DID resolvers
      const didResolver = new Resolver({
        ...ethrDidResolver({
          infuraProjectId: process.env.INFURA_PROJECT_ID,
          networks: [
            { name: 'mainnet', rpcUrl: 'https://mainnet.infura.io/v3/' + process.env.INFURA_PROJECT_ID },
            { name: 'goerli', rpcUrl: 'https://goerli.infura.io/v3/' + process.env.INFURA_PROJECT_ID },
          ],
        }),
      });

      // Create Veramo agent
      this.agent = createAgent<IDIDManager & IKeyManager & IDataStore & IDataStoreORM & IResolver & ICredentialPlugin>({
        plugins: [
          new KeyManager({
            store: new KeyStore(this.dbConnection),
            kms: {
              local: kms,
            },
          }),
          new DIDManager({
            store: new DIDStore(this.dbConnection),
            defaultProvider: 'did:ethr:goerli',
            providers: {
              'did:ethr': new EthrDIDProvider({
                defaultKms: 'local',
                network: 'goerli',
                rpcUrl: 'https://goerli.infura.io/v3/' + process.env.INFURA_PROJECT_ID,
                gas: 1000001,
                ttl: 60 * 60 * 24 * 30 * 12, // 1 year
              }),
              'did:ethr:goerli': new EthrDIDProvider({
                defaultKms: 'local',
                network: 'goerli',
                rpcUrl: 'https://goerli.infura.io/v3/' + process.env.INFURA_PROJECT_ID,
                gas: 1000001,
                ttl: 60 * 60 * 24 * 30 * 12,
              }),
            },
          }),
          new DIDResolverPlugin({
            resolver: didResolver,
          }),
          new CredentialPlugin(),
        ],
      });

      // Create or load issuer DID
      await this.setupIssuerDID();

      this.isInitialized = true;
      console.log('[Veramo] Service initialized successfully');
      console.log('[Veramo] Issuer DID:', this.issuerDID);

    } catch (error) {
      console.error('[Veramo] Initialization failed:', error);
      throw new Error(`Veramo initialization failed: ${error}`);
    }
  }

  /**
   * Setup issuer DID for credential issuance
   */
  private async setupIssuerDID(): Promise<void> {
    try {
      // Check if we have an existing issuer DID
      const existingDIDs = await this.agent!.didManagerFind();
      
      if (existingDIDs.length > 0) {
        this.issuerDID = existingDIDs[0].did;
        console.log('[Veramo] Using existing issuer DID:', this.issuerDID);
        return;
      }

      // Create new issuer DID
      const identifier = await this.agent!.didManagerCreate({
        provider: 'did:ethr:goerli',
        alias: 'dna-id-issuer',
      });

      this.issuerDID = identifier.did;
      console.log('[Veramo] Created new issuer DID:', this.issuerDID);

    } catch (error) {
      console.error('[Veramo] Issuer DID setup failed:', error);
      throw error;
    }
  }

  /**
   * Create a new DID with enhanced metadata
   */
  async createDID(options: DIDCreationOptions = {}): Promise<DIDCreationResult> {
    try {
      await this.initialize();

      console.log('[Veramo] Creating new DID with options:', options);

      const alias = `dna-id-${uuidv4()}`;
      const provider = `did:ethr:${options.network || 'goerli'}`;

      // Create DID
      const identifier = await this.agent!.didManagerCreate({
        provider,
        alias,
      });

      console.log('[Veramo] DID created:', identifier.did);

      // Get DID document
      const didDocument = await this.agent!.resolveDid({ didUrl: identifier.did });

      // Extract key information
      const keys = identifier.keys[0];
      const keyInfo = {
        publicKey: keys.publicKeyHex,
        privateKey: keys.privateKeyHex,
        keyId: keys.kid
      };

      // Enhanced DID document with DNA_ID specific metadata
      const enhancedDIDDocument: DIDDocument = {
        '@context': [
          'https://www.w3.org/ns/did/v1',
          'https://w3id.org/security/suites/ed25519-2020/v1',
          'https://dna-id.org/contexts/v1'
        ],
        id: identifier.did,
        verificationMethod: didDocument.didDocument?.verificationMethod || [],
        authentication: didDocument.didDocument?.authentication || [],
        assertionMethod: didDocument.didDocument?.assertionMethod || [],
        keyAgreement: didDocument.didDocument?.keyAgreement,
        capabilityInvocation: didDocument.didDocument?.capabilityInvocation,
        capabilityDelegation: didDocument.didDocument?.capabilityDelegation,
        service: [
          {
            id: `${identifier.did}#dna-id-service`,
            type: 'DNA_ID_Service',
            serviceEndpoint: `https://api.dna-id.org/did/${identifier.did}`
          },
          ...(didDocument.didDocument?.service || [])
        ],
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      };

      const result: DIDCreationResult = {
        did: identifier.did,
        didDocument: enhancedDIDDocument,
        keys: keyInfo,
        metadata: {
          created: new Date().toISOString(),
          method: options.method || 'ethr',
          network: options.network || 'goerli',
          culturalHeritage: options.culturalHeritage || false,
          gdprCompliant: options.gdprCompliant || true
        }
      };

      console.log('[Veramo] DID creation completed:', {
        did: result.did,
        method: result.metadata.method,
        network: result.metadata.network
      });

      return result;

    } catch (error) {
      console.error('[Veramo] DID creation failed:', error);
      throw new Error(`DID creation failed: ${error}`);
    }
  }

  /**
   * Issue a verifiable credential
   */
  async issueVerifiableCredential(
    subjectDID: string,
    credentialData: any,
    options: VerifiableCredentialOptions
  ): Promise<VerifiableCredential> {
    try {
      await this.initialize();

      if (!this.issuerDID) {
        throw new Error('Issuer DID not available');
      }

      console.log('[Veramo] Issuing verifiable credential:', {
        subject: subjectDID,
        issuer: this.issuerDID,
        type: options.type
      });

      const expirationDate = options.expirationDays 
        ? new Date(Date.now() + options.expirationDays * 24 * 60 * 60 * 1000).toISOString()
        : undefined;

      // Enhanced credential subject with DNA_ID specific fields
      const enhancedCredentialSubject = {
        id: subjectDID,
        ...options.credentialSubject,
        'dna-id:metadata': credentialData,
        'dna-id:issuanceContext': {
          platform: 'DNA_ID',
          version: '2.0.0',
          culturalHeritage: credentialData.culturalHeritage || false,
          gdprCompliant: credentialData.gdprCompliant || true,
          processingTimestamp: new Date().toISOString()
        }
      };

      const credential = await this.agent!.createVerifiableCredential({
        credential: {
          '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://schema.org',
            'https://dna-id.org/contexts/v1'
          ],
          id: `urn:uuid:${uuidv4()}`,
          type: ['VerifiableCredential', ...options.type],
          issuer: {
            id: this.issuerDID,
            name: 'DNA_ID Platform',
            type: 'Organization',
            description: 'Decentralized Identity Infrastructure for Cultural Heritage'
          },
          issuanceDate: new Date().toISOString(),
          expirationDate,
          credentialSubject: enhancedCredentialSubject,
          evidence: options.evidence,
          refreshService: options.refreshService
        },
        proofFormat: 'jwt',
      });

      console.log('[Veramo] Verifiable credential issued:', credential.id);

      return credential as VerifiableCredential;

    } catch (error) {
      console.error('[Veramo] Credential issuance failed:', error);
      throw new Error(`Credential issuance failed: ${error}`);
    }
  }

  /**
   * Create DID and issue credential in one operation
   */
  async createDIDWithCredential(
    didOptions: DIDCreationOptions,
    credentialData: any,
    credentialOptions: VerifiableCredentialOptions
  ): Promise<DIDCreationResult> {
    try {
      console.log('[Veramo] Creating DID with credential...');

      // Create DID
      const didResult = await this.createDID(didOptions);

      // Issue credential for the new DID
      const credential = await this.issueVerifiableCredential(
        didResult.did,
        credentialData,
        credentialOptions
      );

      const result: DIDCreationResult = {
        ...didResult,
        verifiableCredential: credential
      };

      console.log('[Veramo] DID with credential created successfully:', {
        did: result.did,
        credentialId: credential.id,
        credentialType: credential.type
      });

      return result;

    } catch (error) {
      console.error('[Veramo] DID with credential creation failed:', error);
      throw error;
    }
  }

  /**
   * Resolve DID to get DID document
   */
  async resolveDID(did: string): Promise<DIDDocument | null> {
    try {
      await this.initialize();

      console.log('[Veramo] Resolving DID:', did);

      const resolution = await this.agent!.resolveDid({ didUrl: did });

      if (resolution.didDocument) {
        console.log('[Veramo] DID resolved successfully');
        return resolution.didDocument as DIDDocument;
      }

      return null;
    } catch (error) {
      console.error('[Veramo] DID resolution failed:', error);
      return null;
    }
  }

  /**
   * Verify verifiable credential
   */
  async verifyCredential(credential: VerifiableCredential): Promise<{
    verified: boolean;
    issuer: string;
    subject: string;
    issuanceDate: string;
    expirationDate?: string;
    errors?: string[];
  }> {
    try {
      await this.initialize();

      console.log('[Veramo] Verifying credential:', credential.id);

      const verification = await this.agent!.verifyCredential({
        credential: credential as any
      });

      const result = {
        verified: verification.verified,
        issuer: typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id,
        subject: credential.credentialSubject.id,
        issuanceDate: credential.issuanceDate,
        expirationDate: credential.expirationDate,
        errors: verification.error ? [verification.error.message] : undefined
      };

      console.log('[Veramo] Credential verification result:', {
        verified: result.verified,
        credentialId: credential.id
      });

      return result;

    } catch (error) {
      console.error('[Veramo] Credential verification failed:', error);
      return {
        verified: false,
        issuer: '',
        subject: '',
        issuanceDate: '',
        errors: [error instanceof Error ? error.message : 'Verification failed']
      };
    }
  }

  /**
   * List all managed DIDs
   */
  async listDIDs(): Promise<Array<{
    did: string;
    alias?: string;
    provider: string;
    keys: any[];
    services: any[];
    created?: string;
  }>> {
    try {
      await this.initialize();

      const identifiers = await this.agent!.didManagerFind();

      return identifiers.map(identifier => ({
        did: identifier.did,
        alias: identifier.alias,
        provider: identifier.provider,
        keys: identifier.keys,
        services: identifier.services,
        created: identifier.created
      }));

    } catch (error) {
      console.error('[Veramo] DID listing failed:', error);
      return [];
    }
  }

  /**
   * Update DID document (add service endpoints, etc.)
   */
  async updateDIDDocument(
    did: string,
    updates: {
      services?: any[];
      verificationMethods?: any[];
    }
  ): Promise<boolean> {
    try {
      await this.initialize();

      console.log('[Veramo] Updating DID document:', did);

      // Add service endpoints
      if (updates.services) {
        for (const service of updates.services) {
          await this.agent!.didManagerAddService({
            did,
            service
          });
        }
      }

      // Add verification methods
      if (updates.verificationMethods) {
        for (const vm of updates.verificationMethods) {
          await this.agent!.didManagerAddKey({
            did,
            key: vm
          });
        }
      }

      console.log('[Veramo] DID document updated successfully');
      return true;

    } catch (error) {
      console.error('[Veramo] DID document update failed:', error);
      return false;
    }
  }

  /**
   * Revoke/deactivate a DID (GDPR compliance)
   */
  async revokeDID(did: string, reason?: string): Promise<boolean> {
    try {
      await this.initialize();

      console.log('[Veramo] Revoking DID:', did, 'Reason:', reason);

      // In a real implementation, you would update the DID document on-chain
      // to mark it as revoked. For now, we'll remove it from local storage.
      
      const success = await this.agent!.didManagerDelete({ did });

      if (success) {
        console.log('[Veramo] DID revoked successfully');
      }

      return success;

    } catch (error) {
      console.error('[Veramo] DID revocation failed:', error);
      return false;
    }
  }

  /**
   * Export DID and credentials (GDPR data portability)
   */
  async exportDIDData(did: string): Promise<{
    did: string;
    didDocument: DIDDocument | null;
    credentials: VerifiableCredential[];
    keys: any[];
    exportTimestamp: string;
  }> {
    try {
      await this.initialize();

      console.log('[Veramo] Exporting DID data:', did);

      const [didDocument, credentials, identifier] = await Promise.all([
        this.resolveDID(did),
        this.agent!.dataStoreORMGetVerifiableCredentials({
          where: [{ column: 'subject', value: [did] }]
        }),
        this.agent!.didManagerGet({ did })
      ]);

      const exportData = {
        did,
        didDocument,
        credentials: credentials as VerifiableCredential[],
        keys: identifier.keys,
        exportTimestamp: new Date().toISOString()
      };

      console.log('[Veramo] DID data exported:', {
        did,
        credentialsCount: credentials.length,
        keysCount: identifier.keys.length
      });

      return exportData;

    } catch (error) {
      console.error('[Veramo] DID data export failed:', error);
      throw error;
    }
  }

  /**
   * Test Veramo service functionality
   */
  async testService(): Promise<{
    status: 'healthy' | 'unhealthy';
    tests: {
      initialization: boolean;
      didCreation: boolean;
      credentialIssuance: boolean;
      didResolution: boolean;
    };
    details?: any;
  }> {
    const tests = {
      initialization: false,
      didCreation: false,
      credentialIssuance: false,
      didResolution: false
    };

    try {
      // Test initialization
      await this.initialize();
      tests.initialization = true;

      // Test DID creation
      const testDID = await this.createDID({
        metadata: { test: true },
        culturalHeritage: false,
        gdprCompliant: true
      });
      tests.didCreation = true;

      // Test credential issuance
      const testCredential = await this.issueVerifiableCredential(
        testDID.did,
        { test: true },
        {
          type: ['TestCredential'],
          credentialSubject: { test: true },
          expirationDays: 1
        }
      );
      tests.credentialIssuance = true;

      // Test DID resolution
      const resolved = await this.resolveDID(testDID.did);
      tests.didResolution = !!resolved;

      // Cleanup test DID
      await this.revokeDID(testDID.did, 'test-cleanup');

      return {
        status: 'healthy',
        tests,
        details: {
          testDID: testDID.did,
          testCredentialId: testCredential.id,
          issuerDID: this.issuerDID
        }
      };

    } catch (error) {
      console.error('[Veramo] Service test failed:', error);
      return {
        status: 'unhealthy',
        tests,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Get service status and metrics
   */
  async getServiceStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    initialized: boolean;
    issuerDID: string | null;
    databaseConnected: boolean;
    totalDIDs: number;
    totalCredentials: number;
    lastActivity?: string;
  }> {
    try {
      const [dids, credentials] = await Promise.all([
        this.agent?.didManagerFind() || [],
        this.agent?.dataStoreORMGetVerifiableCredentials() || []
      ]);

      return {
        status: this.isInitialized ? 'healthy' : 'unhealthy',
        initialized: this.isInitialized,
        issuerDID: this.issuerDID,
        databaseConnected: !!this.dbConnection?.isInitialized,
        totalDIDs: dids.length,
        totalCredentials: credentials.length,
        lastActivity: new Date().toISOString()
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        initialized: false,
        issuerDID: null,
        databaseConnected: false,
        totalDIDs: 0,
        totalCredentials: 0
      };
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.dbConnection?.isInitialized) {
        await this.dbConnection.destroy();
      }
      
      this.agent = null;
      this.dbConnection = null;
      this.issuerDID = null;
      this.isInitialized = false;
      
      console.log('[Veramo] Service cleaned up');
    } catch (error) {
      console.error('[Veramo] Cleanup failed:', error);
    }
  }
}

// Export singleton instance
export const veramoDIDService = new VeramoDIDService();