# HeliXID BioAgents

## Overview

HeliXID BioAgents is a comprehensive, modular AI-powered agent system designed for automated metadata processing, GDPR compliance analysis, and decentralized identity (DID) creation for cultural heritage and research datasets. This revamped architecture provides enhanced functionality, better extensibility, and seamless integration with your HeliXID platform.

## 🌟 Key Features

- **Modular Plugin Architecture**: Extensible system with specialized plugins for different tasks
- **AI-Powered Enrichment**: Uses LangChain.js with multiple LLM providers (OpenAI, Anthropic)
- **GDPR Compliance**: Automated analysis and compliance checking
- **Cultural Heritage Focus**: Specialized processing for cultural datasets with sensitivity awareness
- **DID & VC Creation**: W3C-compliant Verifiable Credentials using Veramo
- **OriginTrail DKG Integration**: Optional publishing to decentralized knowledge graph
- **Comprehensive Audit Trail**: Full provenance tracking and logging
- **Event-Driven Architecture**: Real-time status updates and monitoring

## 🏗️ Architecture

### Core Components

1. **AgentCore**: Central orchestration engine
2. **Plugins**: Specialized modules for specific tasks
3. **Workflows**: Configurable processing pipelines
4. **Context System**: Shared state and configuration management

### Plugin System

- **DataverseHarvesterPlugin**: Extracts metadata from Dataverse repositories
- **LangChainEnricherPlugin**: AI-powered metadata enrichment and analysis
- **VeramoDIDIssuerPlugin**: Creates DIDs and Verifiable Credentials

## 🚀 Quick Start

### Installation

```bash
cd bioagents
npm install
npm run build
```

### Basic Usage

```typescript
import { createHeliXIDBioAgent } from './bioagents/src/index';

// Configure the agent
const config = {
  llm: {
    provider: 'openai',
    model: 'gpt-4',
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0.3
  },
  dataverse: {
    apiUrl: 'https://demo.dataverse.org',
    apiKey: process.env.DATAVERSE_API_KEY
  },
  dkg: {
    nodeUrl: 'https://api.origintrail.network',
    wallet: {
      privateKey: process.env.DKG_PRIVATE_KEY,
      public: process.env.DKG_PUBLIC_KEY
    }
  },
  gdpr: {
    strictMode: true,
    auditLevel: 'comprehensive'
  }
};

// Create and initialize agent
const agent = await createHeliXIDBioAgent(config);

// Process a dataset
const result = await agent.executeWorkflow('harvest-enrich-issue', {
  datasetId: 'your-dataset-id',
  enrichmentOptions: {
    culturalContext: true,
    gdprCompliance: true,
    qualityAssessment: true
  },
  didOptions: {
    publishToDKG: true,
    expirationDays: 365
  }
});

console.log('DID created:', result.data.didResult.did);
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in your project root:

```env
# LLM Configuration
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Dataverse Configuration
DATAVERSE_API_URL=https://demo.dataverse.org
DATAVERSE_API_KEY=your_dataverse_api_key

# OriginTrail DKG Configuration
DKG_NODE_URL=https://api.origintrail.network
DKG_PRIVATE_KEY=your_private_key
DKG_PUBLIC_KEY=your_public_key

# DID Issuer Configuration
ISSUER_DID=did:ethr:0x...
ISSUER_PRIVATE_KEY=your_issuer_private_key
```

### Advanced Configuration

```typescript
const config: AgentConfig = {
  llm: {
    provider: 'openai', // 'openai' | 'anthropic' | 'local'
    model: 'gpt-4',
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0.3,
    maxTokens: 2000
  },
  dataverse: {
    apiUrl: 'https://demo.dataverse.org',
    apiKey: process.env.DATAVERSE_API_KEY
  },
  dkg: {
    nodeUrl: 'https://api.origintrail.network',
    wallet: {
      privateKey: process.env.DKG_PRIVATE_KEY,
      public: process.env.DKG_PUBLIC_KEY
    }
  },
  gdpr: {
    strictMode: true,
    auditLevel: 'comprehensive' // 'basic' | 'detailed' | 'comprehensive'
  }
};
```

## 📋 Available Workflows

### Main Workflow: `harvest-enrich-issue`

Complete end-to-end processing:
1. Harvests metadata from Dataverse
2. Enriches with AI analysis
3. Performs GDPR compliance check
4. Creates DID and Verifiable Credential
5. Optionally publishes to OriginTrail DKG

```typescript
const result = await agent.executeWorkflow('harvest-enrich-issue', {
  datasetId: 'dataset-123',
  enrichmentOptions: {
    culturalContext: true,
    multilingualProcessing: false,
    gdprCompliance: true,
    qualityAssessment: true
  },
  didOptions: {
    publishToDKG: true,
    expirationDays: 365,
    credentialType: 'CulturalHeritageDatasetCredential'
  }
});
```

### Test Workflows

For testing individual components:

- `test-harvest`: Test Dataverse harvesting
- `test-enrichment`: Test AI enrichment
- `test-did-issuance`: Test DID creation

## 🔌 Plugin Development

### Creating a Custom Plugin

```typescript
import { AgentPlugin, AgentContext } from './core/AgentCore';

export class CustomPlugin implements AgentPlugin {
  name = 'custom-plugin';
  version = '1.0.0';
  description = 'Custom processing plugin';

  async initialize(context: AgentContext): Promise<void> {
    // Initialize plugin resources
    context.logger.info('Custom plugin initialized');
  }

  async execute(input: any, context: AgentContext): Promise<any> {
    const { logger, metrics } = context;
    
    // Plugin logic here
    logger.info('Executing custom plugin');
    
    // Track metrics
    metrics.increment('custom.plugin.executions');
    
    return { result: 'processed' };
  }

  async cleanup(): Promise<void> {
    // Cleanup resources
  }
}
```

### Registering Custom Plugins

```typescript
const agent = new AgentCore(config);
await agent.registerPlugin(new CustomPlugin());
```

## 📊 Monitoring and Metrics

The system provides comprehensive monitoring:

- **Execution Metrics**: Duration, success/failure rates
- **Audit Trail**: Complete provenance tracking
- **Event Logging**: Structured logging with context
- **Status Monitoring**: Real-time agent status

```typescript
// Get agent status
const status = agent.getAgentStatus();
console.log('Plugins:', status.plugins);
console.log('Workflows:', status.workflows);

// Listen to events
agent.on('workflow:started', (event) => {
  console.log('Workflow started:', event.name);
});

agent.on('workflow:completed', (event) => {
  console.log('Workflow completed:', event.name, 'Duration:', event.duration);
});
```

## 🔒 Security Features

- **GDPR Compliance Analysis**: Automated detection of personal data
- **Cultural Sensitivity**: Identification of sensitive cultural content
- **Audit Trails**: Complete processing history
- **Secure Key Management**: Environment-based configuration
- **Data Minimization**: Processing only necessary data

## 🌍 Integration with HeliXID Platform

### Service Integration

The `BioAgentsService` provides a clean interface for your main application:

```typescript
import { BioAgentsService } from './services/bioAgentsServices';

const bioAgents = new BioAgentsService();
await bioAgents.initialize();

// Process dataset
const result = await bioAgents.processDataset({
  datasetId: 'example-dataset',
  publishToDKG: true
});

// Get agent status
const status = bioAgents.getAgentStatus();
```

### React Component Integration

Use the `BioAgentsProcessor` component for UI integration:

```typescript
import BioAgentsProcessor from './components/BioAgents';

function App() {
  return (
    <div>
      <BioAgentsProcessor />
    </div>
  );
}
```

## 🛠️ Development

### Building

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
```

## 📝 API Reference

### Core Classes

- **AgentCore**: Main orchestration engine
- **AgentPlugin**: Base interface for plugins
- **AgentContext**: Shared context and configuration

### Plugin Classes

- **DataverseHarvesterPlugin**: Dataverse integration
- **LangChainEnricherPlugin**: AI enrichment
- **VeramoDIDIssuerPlugin**: DID/VC creation

### Workflow Functions

- **harvestEnrichIssueWorkflow**: Main processing workflow
- **testHarvestWorkflow**: Harvest testing
- **testEnrichmentWorkflow**: Enrichment testing
- **testDIDIssuanceWorkflow**: DID creation testing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the HeliXID team
- Check the documentation

## 🔄 Changelog

### Version 1.0.0

- Complete architecture revamp
- Modular plugin system
- Enhanced AI capabilities
- GDPR compliance features
- Cultural heritage specialization
- DID/VC integration
- OriginTrail DKG support

---

**HeliXID BioAgents** - Empowering cultural heritage preservation through AI and decentralized identity.
