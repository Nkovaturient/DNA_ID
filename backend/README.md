# HeliXID Backend

Backend service for the HeliXID Decentralized Identity Infrastructure with Powergate, BioAgents, and Dataverse integration.

## 🚀 Features

- **Powergate Integration**: IPFS/Filecoin storage via Textile Powergate
- **BioAgents**: AI-driven metadata enrichment and processing
- **Unified DID Resolver**: Combines data from multiple sources
- **Dataverse Integration**: Academic dataset management
- **GDPR Compliance**: Built-in privacy and consent management
- **Cultural Heritage Focus**: Specialized metadata for cultural datasets

## 📋 Prerequisites

- Node.js 18+
- Docker & Docker Compose
- TypeScript

## 🔧 Installation

1. **Clone and setup backend**:
```bash
cd backend
npm install
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start infrastructure services**:
```bash
npm run powergate:start
```

4. **Run development server**:
```bash
npm run dev
```

## 🐳 Docker Setup

For complete infrastructure including Powergate, IPFS, Redis, and PostgreSQL:

```bash
docker-compose up -d
```

This starts:
- **Powergate**: `http://localhost:6002`
- **IPFS**: `http://localhost:8080`
- **Redis**: `localhost:6379`
- **PostgreSQL**: `localhost:5432`
- **Backend API**: `http://localhost:3001`

## 🌐 API Endpoints

### Unified DID Resolver
- `GET /resolve?did={did}` - Resolve DID from all sources

### Storage Operations
- `POST /api/storage/upload` - Store data on IPFS/Filecoin
- `POST /api/storage/upload-file` - Store files on IPFS/Filecoin
- `GET /api/storage/retrieve/:cid` - Retrieve data by CID
- `GET /api/storage/info/:cid` - Get storage information
- `GET /api/storage/list` - List all stored data
- `POST /api/storage/did-document` - Store DID document
- `POST /api/storage/verifiable-credentials` - Store VCs

### Health Check
- `GET /` - API status and service availability

## 🔌 Integration Services

### Powergate Client
```typescript
import { getPowergateInstance } from './powergate';

const pow = getPowergateInstance();
const { cid } = await pow.ffs.addToHot(buffer);
```

### BioAgents
```typescript
import { getBioAgentInstance } from './bioagents';

const agent = getBioAgentInstance();
const result = await agent.executeWorkflow('harvest-enrich-issue', input);
```

## 📊 Usage Examples

### Store DID Document
```bash
curl -X POST http://localhost:3001/api/storage/did-document \
  -H "Content-Type: application/json" \
  -d '{
    "didDocument": {
      "@context": ["https://www.w3.org/ns/did/v1"],
      "id": "did:flow:testnet:0x123",
      "controller": "did:flow:testnet:0x123"
    }
  }'
```

### Resolve DID
```bash
curl "http://localhost:3001/resolve?did=did:flow:testnet:0x123"
```

### Upload File
```bash
curl -X POST http://localhost:3001/api/storage/upload-file \
  -F "file=@dataset.json" \
  -F "dataType=dataset"
```

## 🔧 Configuration

Key environment variables:

```bash
# Powergate
POWERGATE_HOST=http://localhost:6002

# Blockchain
FLOW_ACCESS_NODE=https://rest-testnet.onflow.org
NEAR_NODE_URL=https://rpc.testnet.near.org

# Dataverse
DATAVERSE_API_URL=https://demo.dataverse.org
DATAVERSE_API_KEY=your_key

# AI Services
OPENAI_API_KEY=your_key
```

## 🛠 Development

### Build
```bash
npm run build
```

### Type Checking
```bash
npm run lint
```

### Testing
```bash
npm test
```

### Database Migration
```bash
npm run migrate
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic services
│   ├── powergate.ts     # Powergate client setup
│   ├── bioagents.ts     # BioAgents configuration
│   └── index.ts         # Main server file
├── docker-compose.yml   # Infrastructure services
├── package.json
└── tsconfig.json
```

## 🔗 Integration with Frontend

The backend provides APIs that the frontend can consume:

```typescript
// Frontend integration
const BACKEND_URL = 'http://localhost:3001';

// Upload file to Powergate
const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${BACKEND_URL}/api/storage/upload-file`, {
    method: 'POST',
    body: formData
  });
  
  return response.json();
};

// Resolve DID
const resolveDID = async (did: string) => {
  const response = await fetch(`${BACKEND_URL}/resolve?did=${did}`);
  return response.json();
};
```

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
Set production environment variables:
- `NODE_ENV=production`
- `POWERGATE_HOST=your_powergate_instance`
- Database and storage credentials
- API keys for external services

## 🔒 Security

- CORS configuration for frontend integration
- Rate limiting on API endpoints
- Input validation and sanitization
- Secure file upload handling
- Environment-based configuration

## 📈 Monitoring

The backend includes:
- Request logging via Morgan
- Error handling and reporting
- Health check endpoints
- Prometheus metrics (via Powergate)

## 🤝 Contributing

1. Follow TypeScript best practices
2. Add tests for new features
3. Update documentation
4. Ensure Docker compatibility

## 📄 License

MIT License - see LICENSE file for details.
