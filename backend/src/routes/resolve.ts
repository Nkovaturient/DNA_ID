import express, { Request, Response } from 'express';
import { getPowergateInstance } from '../powergate';
import { getBioAgentInstance } from '../bioagents';
import * as fcl from '@onflow/fcl';
import { connect, keyStores } from 'near-api-js';
import axios from 'axios';

const router = express.Router();

interface ResolvedDIDResponse {
  did: string;
  didDocument: any;
  metadata: any;
  verifiableCredentials: any[];
  storage: {
    ipfsHash?: string;
    filecoinDeal?: string;
    cid?: string;
  };
  provenance: {
    originTrail?: any;
    auditTrail: any[];
  };
  dataverse?: {
    persistentId?: string;
    doi?: string;
    datasetUrl?: string;
  };
  gdprConsent: any;
  timestamp: string;
}

/**
 * Unified DID Resolver Endpoint
 * GET /resolve?did={did}
 * 
 * Combines data from:
 * 1. On-chain DID document (Flow/NEAR)
 * 2. Off-chain storage (IPFS/Filecoin via Powergate)
 * 3. Dataverse linkage
 * 4. OriginTrail provenance
 * 5. Audit trail
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { did } = req.query;

    if (!did || typeof did !== 'string') {
      return res.status(400).json({
        error: 'DID parameter is required',
        message: 'Please provide a valid DID in the format did:method:network:identifier'
      });
    }

    console.log(`[Resolver] Resolving DID: ${did}`);

    // Parse DID to determine method and network
    const didParts = did.split(':');
    if (didParts.length < 3) {
      return res.status(400).json({
        error: 'Invalid DID format',
        message: 'DID must be in format did:method:network:identifier'
      });
    }

    const [, method, network, identifier] = didParts;

    // Initialize response object
    const resolvedResponse: ResolvedDIDResponse = {
      did,
      didDocument: null,
      metadata: null,
      verifiableCredentials: [],
      storage: {},
      provenance: {
        auditTrail: []
      },
      gdprConsent: null,
      timestamp: new Date().toISOString()
    };

    // Step 1: Read on-chain DID document
    console.log(`[Resolver] Step 1: Reading on-chain DID document for ${method}`);
    try {
      if (method === 'flow') {
        resolvedResponse.didDocument = await readFlowDIDDocument(identifier, network);
      } else if (method === 'near') {
        resolvedResponse.didDocument = await readNearDIDDocument(identifier, network);
      }
    } catch (error: any) {
      console.warn(`[Resolver] Failed to read on-chain DID: ${error.message}`);
    }

    // Step 2: Fetch storage information from Powergate
    console.log('[Resolver] Step 2: Fetching storage information from Powergate');
    try {
      const pow = getPowergateInstance();
      
      // Try to find the CID associated with this DID
      // In a real implementation, you'd store DID -> CID mappings in a database
      const cid = await findCIDForDID(did);
      
      if (cid) {
        resolvedResponse.storage.cid = cid;
        
        // Get storage info
        const storageInfo = await pow.ffs.show(cid);
        resolvedResponse.storage.ipfsHash = cid;
        
        // Get the actual data
        const stream = pow.ffs.get(cid);
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        const data = Buffer.concat(chunks);
        const metadata = JSON.parse(data.toString());
        resolvedResponse.metadata = metadata;
      }
    } catch (error: any) {
      console.warn(`[Resolver] Failed to fetch storage data: ${error.message}`);
    }

    // Step 3: Check Dataverse linkage
    console.log('[Resolver] Step 3: Checking Dataverse linkage');
    try {
      const dataverseInfo = await findDataverseLinkage(did);
      if (dataverseInfo) {
        resolvedResponse.dataverse = dataverseInfo;
      }
    } catch (error:any) {
      console.warn(`[Resolver] Failed to fetch Dataverse linkage: ${error.message}`);
    }

    // Step 4: Get OriginTrail provenance
    console.log('[Resolver] Step 4: Fetching OriginTrail provenance');
    try {
      const provenance = await getOriginTrailProvenance(did);
      if (provenance) {
        resolvedResponse.provenance.originTrail = provenance;
      }
    } catch (error: any) {
      console.warn(`[Resolver] Failed to fetch OriginTrail provenance: ${error.message}`);
    }

    // Step 5: Get audit trail
    console.log('[Resolver] Step 5: Fetching audit trail');
    try {
      const auditTrail = await getAuditTrail(did);
      resolvedResponse.provenance.auditTrail = auditTrail;
    } catch (error: any) {
      console.warn(`[Resolver] Failed to fetch audit trail: ${error.message}`);
    }

    // Step 6: Fetch Verifiable Credentials
    console.log('[Resolver] Step 6: Fetching Verifiable Credentials');
    try {
      const credentials = await getVerifiableCredentials(did);
      resolvedResponse.verifiableCredentials = credentials;
    } catch (error: any) {
      console.warn(`[Resolver] Failed to fetch VCs: ${error.message}`);
    }

    console.log(`[Resolver] Successfully resolved DID: ${did}`);
    
    res.json({
      success: true,
      data: resolvedResponse,
      resolvedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Resolver] Resolution failed:', error);
    res.status(500).json({
      error: 'DID resolution failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Helper functions

async function readFlowDIDDocument(identifier: string, network: string) {
  // Configure Flow FCL
  fcl.config({
    'accessNode.api': network === 'mainnet' 
      ? 'https://rest-mainnet.onflow.org' 
      : 'https://rest-testnet.onflow.org'
  });

  // Read DID document from Flow blockchain
  // This would be a Cadence script call
  const script = `
    pub fun main(address: Address): String? {
      // Your Cadence script to read DID document
      return nil
    }
  `;

  try {
    const result = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(identifier, t.Address)]
    });
    return result;
  } catch (error: any) {
    throw new Error(`Failed to read Flow DID document: ${error.message}`);
  }
}

async function readNearDIDDocument(identifier: string, network: string) {
  // Configure NEAR connection
  const keyStore = new keyStores.InMemoryKeyStore();
  const config = {
    networkId: network,
    keyStore,
    nodeUrl: network === 'mainnet' 
      ? 'https://rpc.mainnet.near.org' 
      : 'https://rpc.testnet.near.org',
    walletUrl: `https://wallet.${network}.near.org`,
    helperUrl: `https://helper.${network}.near.org`,
  };

  try {
    const near = await connect(config);
    const account = await near.account(identifier);
    
    // Call view method on DID contract
    const result = await account.viewFunction({
      contractId: process.env.NEAR_DID_CONTRACT_ID || 'did-registry.testnet',
      methodName: 'get_did_document',
      args: { did: identifier }
    });
    
    return result;
  } catch (error: any) {
    throw new Error(`Failed to read NEAR DID document: ${error.message}`);
  }
}

async function findCIDForDID(did: string): Promise<string | null> {
  // TODOS:, this would query your database
  // For now, return null or implement a simple lookup
  // You would store DID -> CID mappings when creating DIDs
  return null;
}

async function findDataverseLinkage(did: string) {
  // Query our database for Dataverse linkage
  // This would return DOI, persistent ID, dataset URL etc.
  return null;
}

async function getOriginTrailProvenance(did: string) {
  // Query OriginTrail DKG for provenance information
  try {
    const response = await axios.get(`${process.env.ORIGINTRAIL_NODE_URL}/knowledge-assets`, {
      params: { did },
      headers: {
        'Authorization': `Bearer ${process.env.ORIGINTRAIL_API_KEY}`
      }
    });
    return response.data;
  } catch (error) {
    return null;
  }
}

async function getAuditTrail(did: string) {
  // Query your database for audit trail events
  // This would return creation, updates, access logs etc.
  return [];
}

async function getVerifiableCredentials(did: string) {
  // Fetch VCs associated with this DID
  // Could be stored in Powergate, database, or other storage
  return [];
}

export { router as resolveDID };
