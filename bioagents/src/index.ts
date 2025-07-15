import { AgentConfig, AgentCore } from './core/AgentCore';
import { DataverseHarvesterPlugin } from './plugins/DataverseHarvesterPlugin';
import { LangChainEnricherPlugin } from './plugins/LangChainEnricherPlugin';
import { VeramoDIDIssuerPlugin } from './plugins/VeramoDIDIssuerPlugin';
import harvestEnrichIssueWorkflow, { testHarvestWorkflow, testEnrichmentWorkflow, testDIDIssuanceWorkflow } from './workflows/harvestEnrichIssueWorkflow';

// Core exports
export { AgentCore } from './core/AgentCore';
export type { 
  AgentPlugin, 
  AgentContext, 
  AgentConfig, 
  Logger, 
  MetricsCollector, 
  WorkflowResult 
} from './core/AgentCore';

// Plugin exports
// export { ExamplePlugin } from './plugins/ExamplePlugin';
export { DataverseHarvesterPlugin } from './plugins/DataverseHarvesterPlugin';
export { LangChainEnricherPlugin } from './plugins/LangChainEnricherPlugin';
export { VeramoDIDIssuerPlugin } from './plugins/VeramoDIDIssuerPlugin';

// Type exports from plugins
export type { DatasetMetadata, DataverseConfig } from './plugins/DataverseHarvesterPlugin';
export type { EnrichmentOptions, EnrichedMetadata } from './plugins/LangChainEnricherPlugin';
export type { DIDDocument, VerifiableCredential, DIDCreationResult } from './plugins/VeramoDIDIssuerPlugin';

// Workflow exports
// export { default as exampleWorkflow } from './workflows/exampleWorkflow';
export { default as harvestEnrichIssueWorkflow, testHarvestWorkflow, testEnrichmentWorkflow, testDIDIssuanceWorkflow } from './workflows/harvestEnrichIssueWorkflow';
export type { HarvestEnrichIssueInput, HarvestEnrichIssueResult } from './workflows/harvestEnrichIssueWorkflow';

// Utility function to create a configured agent
export function createAgent(config: AgentConfig) {
  return new AgentCore(config);
}

// Factory function to create a fully configured HeliXID BioAgents instance
export async function createHeliXIDBioAgent(config: AgentConfig) {
  const agent = new AgentCore(config);
  
  // Register all plugins
  await agent.registerPlugin(new DataverseHarvesterPlugin());
  await agent.registerPlugin(new LangChainEnricherPlugin());
  await agent.registerPlugin(new VeramoDIDIssuerPlugin());
  
  // Register workflows
  agent.registerWorkflow('harvest-enrich-issue', harvestEnrichIssueWorkflow);
  agent.registerWorkflow('test-harvest', testHarvestWorkflow);
  agent.registerWorkflow('test-enrichment', testEnrichmentWorkflow);
  agent.registerWorkflow('test-did-issuance', testDIDIssuanceWorkflow);
  
  return agent;
}
