import { EventEmitter } from 'events';

export interface AgentPlugin {
  name: string;
  version: string;
  description: string;
  execute(input: any, context: AgentContext): Promise<any>;
  initialize?(context: AgentContext): Promise<void>;
  cleanup?(): Promise<void>;
}

export interface AgentContext {
  plugins: Map<string, AgentPlugin>;
  config: AgentConfig;
  state: Map<string, any>;
  logger: Logger;
  metrics: MetricsCollector;
  addToAuditTrail?: (step: string, stepInput?: any, stepOutput?: any, stepDuration?: number) => any;
}

export interface AgentConfig {
  llm?: {
    provider: 'openai' | 'azure' | 'local';
    model: string;
    apiKey?: string;
    endpoint?: string;
    temperature?: number;
    maxTokens?: number;
  };
  dataverse?: {
    apiUrl: string;
    apiKey?: string;
  };
  dkg?: {
    nodeUrl: string;
    wallet?: {
      privateKey: string;
      public: string;
    };
  };
  gdpr?: {
    strictMode: boolean;
    auditLevel: 'basic' | 'detailed' | 'comprehensive';
  };
}

export interface Logger {
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, error?: Error, meta?: any): void;
  debug(message: string, meta?: any): void;
}

export interface MetricsCollector {
  increment(metric: string, value?: number): void;
  timing(metric: string, duration: number): void;
  gauge(metric: string, value: number): void;
}

export interface WorkflowResult {
  success: boolean;
  data?: any;
  error?: string;
  metrics: {
    duration: number;
    stepsCompleted: number;
    totalSteps: number;
  };
  auditTrail: Array<{
    step: string;
    timestamp: Date;
    input?: any;
    output?: any;
    duration: number;
  }>;
}

export class AgentCore extends EventEmitter {
  private plugins: Map<string, AgentPlugin> = new Map();
  private workflows: Map<string, Function> = new Map();
  private context: AgentContext;

  constructor(config: AgentConfig) {
    super();
    
    this.context = {
      plugins: this.plugins,
      config,
      state: new Map(),
      logger: this.createLogger(),
      metrics: this.createMetricsCollector(),
      addToAuditTrail: () => {} // default no-op
    };
  }

  /**
   * Register a plugin with the agent core
   */
  async registerPlugin(plugin: AgentPlugin): Promise<void> {
    try {
      // Initialize plugin if it has an initialize method
      if (plugin.initialize) {
        await plugin.initialize(this.context);
      }

      this.plugins.set(plugin.name, plugin);
      this.context.logger.info(`Plugin registered: ${plugin.name} v${plugin.version}`);
      
      this.emit('plugin:registered', { name: plugin.name, version: plugin.version });
    } catch (error: any) {
      this.context.logger.error(`Failed to register plugin: ${plugin.name}`, error);
      throw error;
    }
  }

  /**
   * Register a workflow function
   */
  registerWorkflow(name: string, workflow: Function): void {
    this.workflows.set(name, workflow);
    this.context.logger.info(`Workflow registered: ${name}`);
    this.emit('workflow:registered', { name });
  }

  /**
   * Execute a workflow by name
   */
  async executeWorkflow(workflowName: string, input: any): Promise<WorkflowResult> {
    const startTime = Date.now();
    const auditTrail: Array<any> = [];
    
    try {
      const workflow = this.workflows.get(workflowName);
      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowName}`);
      }

      this.context.logger.info(`Starting workflow: ${workflowName}`, { input });
      this.emit('workflow:started', { name: workflowName, input });

      // Execute workflow with enhanced context
      const workflowContext = {
        ...this.context,
        addToAuditTrail: (step: string, stepInput?: any, stepOutput?: any, stepDuration?: number) => {
          auditTrail.push({
            step,
            timestamp: new Date(),
            input: stepInput,
            output: stepOutput,
            duration: stepDuration || 0
          });
        }
      };

      const result = await workflow(input, workflowContext);
      const duration = Date.now() - startTime;

      this.context.metrics.timing('workflow.duration', duration);
      this.context.logger.info(`Workflow completed: ${workflowName}`, { duration });
      
      this.emit('workflow:completed', { 
        name: workflowName, 
        duration, 
        success: true 
      });

      return {
        success: true,
        data: result,
        metrics: {
          duration,
          stepsCompleted: auditTrail.length,
          totalSteps: auditTrail.length
        },
        auditTrail
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      this.context.logger.error(`Workflow failed: ${workflowName}`, error);
      this.emit('workflow:failed', { 
        name: workflowName, 
        error: error.message, 
        duration 
      });

      return {
        success: false,
        error: error.message,
        metrics: {
          duration,
          stepsCompleted: auditTrail.length,
          totalSteps: auditTrail.length
        },
        auditTrail
      };
    }
  }

  /**
   * Execute a plugin directly
   */
  async executePlugin(pluginName: string, input: any): Promise<any> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginName}`);
    }

    const startTime = Date.now();
    try {
      const result = await plugin.execute(input, this.context);
      const duration = Date.now() - startTime;
      
      this.context.metrics.timing(`plugin.${pluginName}.duration`, duration);
      return result;
    } catch (error: any) {
      this.context.logger.error(`Plugin execution failed: ${pluginName}`, error);
      throw error;
    }
  }

  /**
   * Get plugin information
   */
  getPluginInfo(pluginName: string): AgentPlugin | undefined {
    return this.plugins.get(pluginName);
  }

  /**
   * List all registered plugins
   */
  listPlugins(): Array<{ name: string; version: string; description: string }> {
    return Array.from(this.plugins.values()).map(plugin => ({
      name: plugin.name,
      version: plugin.version,
      description: plugin.description
    }));
  }

  /**
   * List all registered workflows
   */
  listWorkflows(): string[] {
    return Array.from(this.workflows.keys());
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.context.logger.info('Starting agent cleanup...');
    
    // Cleanup all plugins
    for (const [name, plugin] of this.plugins) {
      if (plugin.cleanup) {
        try {
          await plugin.cleanup();
          this.context.logger.info(`Plugin cleaned up: ${name}`);
        } catch (error: any) {
          this.context.logger.error(`Plugin cleanup failed: ${name}`, error);
        }
      }
    }

    this.plugins.clear();
    this.workflows.clear();
    this.context.state.clear();
    
    this.context.logger.info('Agent cleanup completed');
  }

  private createLogger(): Logger {
    return {
      info: (message: string, meta?: any) => {
        console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta || '');
      },
      warn: (message: string, meta?: any) => {
        console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta || '');
      },
      error: (message: string, error?: Error, meta?: any) => {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error?.stack || error, meta || '');
      },
      debug: (message: string, meta?: any) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta || '');
        }
      }
    };
  }

  private createMetricsCollector(): MetricsCollector {
    return {
      increment: (metric: string, value: number = 1) => {
        // In production, send to metrics service (e.g., StatsD, Prometheus)
        this.context.logger.debug(`METRIC INCREMENT: ${metric} +${value}`);
      },
      timing: (metric: string, duration: number) => {
        this.context.logger.debug(`METRIC TIMING: ${metric} ${duration}ms`);
      },
      gauge: (metric: string, value: number) => {
        this.context.logger.debug(`METRIC GAUGE: ${metric} = ${value}`);
      }
    };
  }
}
