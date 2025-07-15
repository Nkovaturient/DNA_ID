import * as fcl from '@onflow/fcl';
import { connect, keyStores } from 'near-api-js';
import { Agent } from '@veramo/core';
import { CredentialPlugin } from '@veramo/credential-w3c';
import axios from 'axios';
import { DID, Dataset, VerifiableCredential, DatasetMetadata } from '../types';
import { dataverseAPI, DataverseFile } from '../../backend/src/controllers/dataverseApi';



// Backend API configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

class IntegrationService {
  private powergateClient: any = null;
  private nearConnection: any = null;
  private veramoAgent: any = null;

  // Flow Integration
  async initializeFlow() {
    fcl.config()
      .put('accessNode.api', 'https://rest-testnet.onflow.org')
      .put('challenge.handshake', 'https://fcl-discovery.onflow.org/testnet/authn')
      .put('discovery.wallet', 'https://fcl-discovery.onflow.org/testnet/authn');
  }

  async createDIDOnFlow(metadata: any): Promise<string> {
    const cadence = `
      transaction(metadataHash: String) {
        prepare(signer: AuthAccount) {
          // Create DID with metadata hash
          let did = "did:flow:testnet:".concat(signer.address.toString())
          // Store metadata hash on-chain
          signer.save(metadataHash, to: /storage/didMetadata)
          log("DID created: ".concat(did))
        }
      }
    `;

    const txId = await fcl.mutate({
      cadence,
      args: (arg: any, t: any) => [arg(JSON.stringify(metadata), t.String)],
      proposer: fcl.authz,
      payer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 1000,
    });

    return txId;
  }

  async resolveDIDFromFlow(did: string): Promise<any> {
    const cadence = `
      pub fun main(address: Address): String? {
        let account = getAccount(address)
        return account.borrow<&String>(from: /storage/didMetadata)
      }
    `;

    const address = did.replace('did:flow:testnet:', '');
    const result = await fcl.query({
      cadence,
      args: (arg: any, t: any) => [arg(address, t.Address)],
    });

    return result;
  }

  // NEAR Integration
  async initializeNear() {
    this.nearConnection = await connect({
      networkId: 'testnet',
      keyStore: new keyStores.BrowserLocalStorageKeyStore(),
      nodeUrl: 'https://rpc.testnet.near.org',
      walletUrl: 'https://wallet.testnet.near.org',
      helperUrl: 'https://helper.testnet.near.org',
      // explorerUrl: 'https://explorer.testnet.near.org',
    });
  }

  async createDIDOnNear(metadata: any): Promise<string> {
    const account = await this.nearConnection.account('your-account.testnet');

    const result = await account.functionCall({
      contractId: 'did-registry.testnet',
      methodName: 'create_did',
      args: {
        metadata_hash: JSON.stringify(metadata),
      },
      gas: '300000000000000',
      attachedDeposit: '1000000000000000000000000', // 1 NEAR
    });

    return result.transaction.hash;
  }





  async uploadToFilecoin(data: any): Promise<{ cid: string; dealId?: string }> {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/storage/upload`, {
        data: data,
        dataType: 'metadata',
        config: {
          hot: {
            enabled: true,
            allowUnfreeze: true,
          },
          cold: {
            enabled: true,
            filecoin: {
              repFactor: 1,
              dealMinDuration: 518400, // ~6 months
            },
          },
        }
      });

      return { 
        cid: response.data.cid, 
        dealId: response.data.jobId 
      };
    } catch (error) {
      console.error('Backend Filecoin upload failed:', error);
      throw error;
    }
  }


  // Dataverse Integration
  async createDatasetInDataverse(metadata: DatasetMetadata, files?: DataverseFile[]): Promise<Dataset> {
    try {
      // Use the proper DataverseAPI class
      const response = await dataverseAPI.createDataset(
        'root', // Default dataverse name
        metadata,
        files
      );

      // Convert Dataverse response to our Dataset type
      const dataset: Dataset = {
        id: response.data.id.toString(),
        title: metadata.title,
        description: metadata.description,
        author: Array.isArray(metadata.author)
          ? (metadata.author.map(a => a.authorName).join(', ') || '')
          : (metadata.author || ''),
        subjects: metadata.subject || [],
        keywords: metadata.keyword || [],
        version: '1.0',
        status: 'draft',
        storageIdentifier: response.data.storageIdentifier,
        language: [],
        email: '',
        institution: '',
        datePublished: '',
        fileCount: 0,
        size: '',
        didLinked: false,
        metadata: {},
      };

      return dataset;
    } catch (error) {
      console.error('Dataverse dataset creation failed:', error);
      throw error;
    }
  }

  async fetchDatasetFromDataverse(persistentId: string): Promise<Dataset> {
    try {
      const response = await dataverseAPI.getDataset(persistentId);
      
      // Convert Dataverse response to our Dataset type
      const dataset: Dataset = {
        id: response.id?.toString() || '',
        didId: response.didId?.toString() || persistentId,
        title: response.title || 'Unknown',
        description: response.description || '',
        author: response.author || '',
        subjects: response.subjects || [],
        fileCount: response.fileCount || 0,
        datePublished: response.datePublished || '',
        institution: response.institution || '',
        status: response.status || 'draft',
        keywords: response.keywords || [],
        language: response.language || [],
        version: response.version || '1.0',
        storageIdentifier: response.storageIdentifier || '',
        email: response.email || '',
        didLinked: response.didLinked || false,
        metadata: response.metadata || {},
        size: response.size || '',
      };

      return dataset;
    } catch (error) {
      console.error('Dataverse dataset fetch failed:', error);
      throw error;
    }
  }

  // Veramo Integration
  async initializeVeramo() {
    this.veramoAgent = new Agent({
      plugins: [
        new CredentialPlugin(),
      ],
    });
  }

  async issueVerifiableCredential(credentialData: any): Promise<VerifiableCredential> {
    if (!this.veramoAgent) {
      await this.initializeVeramo();
    }

    try {
      const credential = await this.veramoAgent.createVerifiableCredential({
        credential: {
          issuer: { id: credentialData.issuer },
          type: ['VerifiableCredential', 'DIDMetadataCredential'],
          credentialSubject: credentialData.subject,
          issuanceDate: new Date().toISOString(),
        },
        proofFormat: 'jwt',
      });

      return credential;
    } catch (error) {
      console.error('VC issuance failed:', error);
      throw error;
    }
  }

  // Enhanced DID operations with new services
  // Deprecated: DID creation should be handled by the backend only
  // async createDID(didData: Partial<DID>): Promise<DID> { ... }

  async fetchDIDs(): Promise<DID[]> {
    // In a real implementation, this would fetch from your backend
    // For now, return mock data
    return [];
  }

  async resolveDID(didId: string): Promise<DID | null> {
    try {
      // Use the new unified resolver backend endpoint
      const response = await axios.get(`${BACKEND_URL}/resolve`, {
        params: { did: didId }
      });

      if (response.data.success) {
        const resolvedData = response.data.data;
        
        // Convert backend response to DID object
        const did: DID = {
          id: resolvedData.did,
          method: resolvedData.did.split(':')[1] as 'flow' | 'near',
          subject: resolvedData.did.split(':')[3] || '',
          created: new Date(resolvedData.timestamp),
          status: 'active',
          metadata: resolvedData.metadata || {
            name: 'Resolved DID',
            description: 'DID resolved from blockchain',
            type: 'dataset',
            tags: [],
            culturalHeritage: false
          },
          storage: {
            ipfsHash: resolvedData.storage.cid || resolvedData.storage.ipfsHash,
            filecoinDeal: resolvedData.storage.filecoinDeal
          },
          gdprConsent: resolvedData.gdprConsent || {
            granted: false,
            timestamp: new Date(),
            purposes: []
          },
          verifiableCredentials: resolvedData.verifiableCredentials || [],
        };

        return did;
      }

      return null;
    } catch (error) {
      console.error('DID resolution failed:', error);
      return null; // Return null instead of throwing to handle gracefully
    }
  }

  async revokeDID(didId: string): Promise<void> {
    // Implement DID revocation logic
    console.log('Revoking DID:', didId);
  }

  // Search functionality
  async searchDIDs(query: string): Promise<DID[]> {
    // Implement search logic
    return [];
  }

  async searchDatasets(query: string): Promise<Dataset[]> {
    try {
      const response = await dataverseAPI.searchDatasets(query);
      
      return response.data?.items?.map((item: any) => ({
        id: item.entity_id?.toString() || '',
        persistentId: item.global_id || '',
        title: item.name || 'Unknown',
        description: item.description || '',
        authors: [],
        subjects: item.subjects || [],
        keywords: [],
        created: new Date(item.published_at || Date.now()),
        updated: new Date(item.published_at || Date.now()),
        version: '1.0',
        status: item.versionState || 'published',
        culturalHeritage: false,
        gdprCompliant: true,
        storageIdentifier: item.identifier || '',
      })) || [];
    } catch (error) {
      console.error('Dataset search failed:', error);
      return [];
    }
  }
  // Event logging for audit trail
  async logEvent(eventType: string, eventData: any): Promise<void> {
    try {
      const event = {
        id: crypto.randomUUID(),
        type: eventType,
        timestamp: new Date().toISOString(),
        data: eventData,
        source: 'integration-service',
      };

      // Store event in IPFS for immutable audit trail
      await this.uploadToFilecoin(event);
      
      // Also log to console for development
      console.log('[Event Log]:', event);

      // In production, you might also want to send to external logging service
      // await externalLogService.log(event);
    } catch (error) {
      console.error('Event logging failed:', error);
      // Don't throw error to avoid breaking main flow
    }
  }

  // GDPR compliance methods
  async requestDataDeletion(didId: string, userConsent: boolean): Promise<void> {
    if (!userConsent) {
      throw new Error('User consent required for data deletion');
    }

    try {
      // 1. Revoke DID on blockchain
      await this.revokeDID(didId);

      // 2. Log deletion event
      await this.logEvent('DID_DELETED', {
        didId,
        timestamp: new Date().toISOString(),
        userConsent: true,
        reason: 'GDPR_REQUEST',
      });

      console.log('Data deletion completed for DID:', didId);
    } catch (error) {
      console.error('Data deletion failed:', error);
      throw error;
    }
  }

  async exportUserData(didId: string): Promise<any> {
    try {
      const did = await this.resolveDID(didId);
      if (!did) {
        throw new Error('DID not found');
      }

      // Compile all user data
      const userData = {
        did: did,
        metadata: did.metadata,
        storage: did.storage,
        gdprConsent: did.gdprConsent,
        verifiableCredentials: did.verifiableCredentials,
        exportTimestamp: new Date().toISOString(),
      };

      // Log export event
      await this.logEvent('DATA_EXPORTED', {
        didId,
        exportTimestamp: userData.exportTimestamp,
      });

      return userData;
    } catch (error) {
      console.error('Data export failed:', error);
      throw error;
    }
  }

  // Service Connectivity Tests
  async testLighthouseConnection(): Promise<{ status: string; details?: any }> {
    try {
      const result = await lighthouseService.testConnection();
      return { status: 'connected', details: result };
    } catch (error) {
      return { status: 'failed', details: error };
    }
  }

  async testOriginTrailConnection(): Promise<{ status: string; details?: any }> {
    try {
      const result = await originTrailDKGService.testConnection();
      return { status: 'connected', details: result };
    } catch (error) {
      return { status: 'failed', details: error };
    }
  }

  async testGDPRComplianceService(): Promise<{ status: string; details?: any }> {
    try {
      const result = await gdprComplianceService.getComplianceStatus();
      return { status: 'active', details: result };
    } catch (error) {
      return { status: 'failed', details: error };
    }
  }

  async testBioAgentsService(): Promise<{ status: string; details?: any }> {
    try {
      const testData = {
        title: 'Test Dataset',
        description: 'This is a test dataset for connectivity verification',
        tags: ['test', 'connectivity']
      };
      const result = await bioAgentsService.analyzeDataset(testData);
      return { status: 'connected', details: result };
    } catch (error) {
      return { status: 'failed', details: error };
    }
  }

  async testDataverseConnection(): Promise<{ status: string; details?: any }> {
    try {
      const result = await dataverseAPI.searchDatasets('test', 10, 0);
      return { status: 'connected', details: { searchResults: result.data?.total_count || 0 } };
    } catch (error) {
      return { status: 'failed', details: error };
    }
  }

  async testAllServiceConnections(): Promise<{
    lighthouse: { status: string; details?: any };
    originTrail: { status: string; details?: any };
    gdpr: { status: string; details?: any };
    bioAgents: { status: string; details?: any };
    dataverse: { status: string; details?: any };
    overall: 'healthy' | 'degraded' | 'unhealthy';
  }> {
    const [lighthouse, originTrail, gdpr, bioAgents, dataverse] = await Promise.allSettled([
      this.testLighthouseConnection(),
      this.testOriginTrailConnection(),
      this.testGDPRComplianceService(),
      this.testBioAgentsService(),
      this.testDataverseConnection()
    ]);

    const results = {
      lighthouse: lighthouse.status === 'fulfilled' ? lighthouse.value : { status: 'failed', details: lighthouse.reason },
      originTrail: originTrail.status === 'fulfilled' ? originTrail.value : { status: 'failed', details: originTrail.reason },
      gdpr: gdpr.status === 'fulfilled' ? gdpr.value : { status: 'failed', details: gdpr.reason },
      bioAgents: bioAgents.status === 'fulfilled' ? bioAgents.value : { status: 'failed', details: bioAgents.reason },
      dataverse: dataverse.status === 'fulfilled' ? dataverse.value : { status: 'failed', details: dataverse.reason },
      overall: 'unhealthy' as 'healthy' | 'degraded' | 'unhealthy'
    };

    // Determine overall health
    const connectedServices = Object.values(results).filter(service => 
      typeof service === 'object' && service.status === 'connected' || service.status === 'active'
    ).length;

    if (connectedServices === 5) {
      results.overall = 'healthy';
    } else if (connectedServices >= 3) {
      results.overall = 'degraded';
    } else {
      results.overall = 'unhealthy';
    }

    return results;
  }

  // Health check endpoint for monitoring
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    services: any;
    version: string;
  }> {
    const serviceTests = await this.testAllServiceConnections();
    
    return {
      status: serviceTests.overall,
      timestamp: new Date().toISOString(),
      services: serviceTests,
      version: '2.0.0' // Enhanced version with new services
    };
  }
}

export const integrationService = new IntegrationService();
