import DKG from 'dkg.js';
import Web3 from 'web3';

export const getDKGInstance = async () => {
  // Ensure Metamask is available
  if (!window.ethereum) throw new Error('Metamask is required');

  // Request account access if needed
  await window.ethereum.request({ method: 'eth_requestAccounts' });

  // Use Metamask's provider
  const web3 = new Web3(window.ethereum);

  // DKG config for browser/Metamask
  const dkg = new DKG({
    environment: 'devnet', // or 'testnet', 'mainnet'
    endpoint: 'http://localhost', // Gateway node URI
    port: 5173,
    blockchain: {
      name: 'gnosis:10200', // or your target chain,
      web3: web3, // Pass the web3 instance
    },
  });

  return dkg;
};

// src/services/dkgService.ts
export const createKnowledgeAsset = async (content: any, options = {}) => {
    const dkg = await getDKGInstance();
    // Metamask will prompt for signing
    const result = await dkg.asset.create(content, options);
    return result; // Contains UAL, tx info, etc.
  };

  export const getKnowledgeAsset = async (UAL: string) => {
    const dkg = await getDKGInstance();
    const result = await dkg.asset.get(UAL);
    return result;
  };
  
  export const queryKnowledgeGraph = async (sparqlQuery: string) => {
    const dkg = await getDKGInstance();
    const result = await dkg.graph.query(sparqlQuery, 'SELECT');
    return result;
  };
  