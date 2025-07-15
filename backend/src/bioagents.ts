import { createHeliXIDBioAgent, AgentCore, AgentConfig } from '../../bioagents/src';
import dotenv from 'dotenv';

dotenv.config();

let bioAgent: AgentCore | null = null;

export const configureBioAgents = async () => {
  try {
    if (!bioAgent) {
      const config: AgentConfig = {
        llm: {
          provider: 'openai',
          model: 'gpt-4',
          apiKey: process.env.OPENAI_API_KEY,
          temperature: 0.3,
          maxTokens: 2000
        },
        dataverse: {
          apiUrl: process.env.DATAVERSE_API_URL || 'https://demo.dataverse.org',
          apiKey: process.env.DATAVERSE_API_KEY
        },
        dkg: {
          nodeUrl: process.env.DKG_NODE_URL || 'https://api.origintrail.network',
          wallet: {
            privateKey: process.env.DKG_PRIVATE_KEY || '',
            public: process.env.DKG_PUBLIC_KEY || ''
          }
        },
        gdpr: {
          strictMode: true,
          auditLevel: 'comprehensive'
        }
      };

      bioAgent = await createHeliXIDBioAgent(config);
      console.log('BioAgents configured successfully.');
    }
  } catch (error) {
    console.error('BioAgents configuration failed:', error);
  }
};

export const getBioAgentInstance = () => {
  if (!bioAgent) {
    throw new Error('BioAgents instance not configured');
  }
  return bioAgent;
};
