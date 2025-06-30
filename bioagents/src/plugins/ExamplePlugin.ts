import { AgentContext, AgentPlugin } from '../core/AgentCore';

export class ExamplePlugin implements AgentPlugin {
  name = 'example-plugin';
  version = '1.0.0';
  description = 'A sample plugin that performs a simple task.';

  async initialize(context: AgentContext): Promise<void> {
    context.logger.info('Example Plugin initialized');
  }

  async execute(input: any, context: AgentContext): Promise<any> {
    context.logger.info(`Executing Example Plugin with input: ${input}`);
    const result = `Processed: ${input}`;
    context.logger.info(`Example Plugin result: ${result}`);
    return { result };
  }

  async cleanup(): Promise<void> {
    console.log('Example Plugin cleaned up');
  }
}
