import { AgentContext } from '../core/AgentCore';

export default async function exampleWorkflow(input: any, context: AgentContext) {
  const { logger, plugins, addToAuditTrail } = context;

  logger.info('Starting Example Workflow');

  // Example: run the example plugin
  const pluginResult = await plugins.get('example-plugin')?.execute(input, context);

  addToAuditTrail?.('example-plugin', input, pluginResult);

  logger.info('Example Workflow completed');

  return pluginResult;
}
