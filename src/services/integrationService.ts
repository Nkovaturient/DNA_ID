import * as fcl from '@onflow/fcl';
import { connect, keyStores } from 'near-api-js';
import { Agent } from '@veramo/core';
import { CredentialPlugin } from '@veramo/credential-w3c';
import axios from 'axios';
import { DID, Dataset, VerifiableCredential, DatasetMetadata } from '../types';
import { dataverseAPI, DataverseFile } from '../api/dataverseApi';
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

  // Powergate/Filecoin Integration
  async initializePowergate() {
    this.powergateClient = createPow({
      host: 'http://localhost:5173',
      debug: true,
    });

    //The returned auth token is the only thing that gives access to the corresponding 
    // user at a later time, so be sure to save it securely.
    //A user auth token can later be set for the Powergate client
    //  so that the client authenticates with the user associated with the auth token.


    // this.powergateClient.setAdminToken("power1212gate-auth23128token")
    // const { user } = await this.powergateClient.admin.users.create() // save this token in localStorage for later use!
    // // return user?.token
    // const token = "<previously generated user auth token>"
    // pow.setToken(token)

    try {
      await this.powergateClient.health.check();
      console.log('Powergate connected successfully');
    } catch (error) {
      console.error('Powergate connection failed:', error);
      throw error;
    }
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

  async retrieveFromFilecoin(cid: string): Promise<any> {
    if (!this.powergateClient) {
      await this.initializePowergate();
    }

    try {
      const stream = this.powergateClient.ffs.get(cid);
      const chunks: Buffer[] = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const data = Buffer.concat(chunks);
      return JSON.parse(data.toString());
    } catch (error) {
      console.error('Filecoin retrieval failed:', error);
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
        authors: metadata.author || [],
        subjects: metadata.subject || [],
        keywords: metadata.keyword || [],
        created: new Date(),
        updated: new Date(),
        version: '1.0',
        status: 'draft',
        culturalHeritage: metadata.culturalHeritage || false,
        gdprCompliant: true,
        storageIdentifier: response.data.storageIdentifier,
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
        persistentId: response.persistentId || persistentId,
        title: response.latestVersion?.metadataBlocks?.citation?.fields?.find((f: any) => f.typeName === 'title')?.value || 'Unknown',
        description: response.latestVersion?.metadataBlocks?.citation?.fields?.find((f: any) => f.typeName === 'dsDescription')?.value?.[0]?.dsDescriptionValue?.value || '',
        authors: response.latestVersion?.metadataBlocks?.citation?.fields?.find((f: any) => f.typeName === 'author')?.value?.map((a: any) => ({
          name: a.authorName?.value || '',
          affiliation: a.authorAffiliation?.value || '',
          identifier: a.authorIdentifier?.value || '',
          identifierScheme: a.authorIdentifierScheme?.value || ''
        })) || [],
        subjects: response.latestVersion?.metadataBlocks?.citation?.fields?.find((f: any) => f.typeName === 'subject')?.value || [],
        keywords: response.latestVersion?.metadataBlocks?.citation?.fields?.find((f: any) => f.typeName === 'keyword')?.value?.map((k: any) => ({
          value: k.keywordValue?.value || '',
          vocabulary: k.keywordVocabulary?.value || '',
          vocabularyURI: k.keywordVocabularyURI?.value || ''
        })) || [],
        created: new Date(response.createTime || Date.now()),
        updated: new Date(response.modificationTime || Date.now()),
        version: response.latestVersion?.versionNumber?.toString() || '1.0',
        status: response.latestVersion?.versionState || 'draft',
        culturalHeritage: !!response.latestVersion?.metadataBlocks?.culturalHeritage,
        gdprCompliant: true,
        storageIdentifier: response.storageIdentifier,
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

  // High-level DID operations
  async createDID(didData: Partial<DID>): Promise<DID> {
    try {
      // 1. Create metadata package
      const metadata = {
        name: didData.metadata?.name || 'Unnamed Dataset',
        description: didData.metadata?.description || '',
        type: didData.metadata?.type || 'dataset',
        tags: didData.metadata?.tags || [],
        culturalHeritage: didData.metadata?.culturalHeritage || false,
        timestamp: new Date().toISOString(),
      };

      // 2. Create dataset in Dataverse if type is 'dataset'
      let dataverseDataset: Dataset | null = null;
      if (metadata.type === 'dataset') {
        const dataverseMetadata: DatasetMetadata = {
          title: metadata.name,
          description: metadata.description,
          authors: [{
            name: didData.metadata?.author || 'DID System',
            affiliation: didData.metadata?.institution || 'Decentralized Network',
            identifier: '',
            identifierScheme: ''
          }],
          contactName: didData.metadata?.author || 'DID System',
          contactEmail: didData.metadata?.contactEmail || 'contact@example.com',
          subjects: ['Computer and Information Science'],
          keywords: metadata.tags.map(tag => ({ value: tag, vocabulary: '', vocabularyURI: '' })),
          culturalHeritage: metadata.culturalHeritage,
          culturalHeritageType: metadata.culturalHeritage ? 'Digital Collection' : undefined,
          depositor: 'DID System'
        };

        dataverseDataset = await this.createDatasetInDataverse(dataverseMetadata);
      }

      // 3. Store metadata on Filecoin/IPFS
      const enrichedMetadata = {
        ...metadata,
        dataverseId: dataverseDataset?.persistentId,
      };
      const { cid, dealId } = await this.uploadToFilecoin(enrichedMetadata);

      // 4. Create DID on blockchain
      let didId: string;
      let txId: string;

      if (didData.method === 'near') {
        txId = await this.createDIDOnNear(enrichedMetadata);
        didId = `did:near:testnet:${txId}`;
      } else {
        txId = await this.createDIDOnFlow(enrichedMetadata);
        didId = `did:flow:testnet:${txId}`;
      }

      // 5. Link DID to Dataverse dataset if created
      if (dataverseDataset) {
        await dataverseAPI.linkDIDToDataset(dataverseDataset.persistentId, didId, cid);
      }

      // 6. Issue Verifiable Credential
      const vc = await this.issueVerifiableCredential({
        issuer: didId,
        subject: {
          id: didId,
          ...enrichedMetadata,
        },
      });

      // 7. Create DID object
      const did: DID = {
        id: didId,
        method: didData.method || 'flow',
        subject: txId,
        created: new Date(),
        status: 'active',
        metadata: {
          name: metadata.name,
          description: metadata.description,
          type: metadata.type as any,
          tags: metadata.tags,
          culturalHeritage: metadata.culturalHeritage,
        },
        storage: {
          ipfsHash: cid,
          filecoinDeal: dealId,
        },
        gdprConsent: {
          granted: didData.gdprConsent?.granted || false,
          timestamp: new Date(),
          purposes: didData.gdprConsent?.purposes || [],
        },
        verifiableCredentials: [vc],
        dataverseId: dataverseDataset?.persistentId,
      };

      // 8. Log the creation event
      await this.logEvent('DID_CREATED', {
        didId,
        method: didData.method || 'flow',
        type: metadata.type,
        dataverseId: dataverseDataset?.persistentId,
        ipfsHash: cid,
        gdprConsent: didData.gdprConsent?.granted || false,
      });

      return did;
    } catch (error) {
      console.error('DID creation failed:', error);
      throw error;
    }
  }

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
          dataverseId: resolvedData.dataverse?.persistentId
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
}

export const integrationService = new IntegrationService();