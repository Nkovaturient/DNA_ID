import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  Cpu, 
  Cloud, 
  Shield, 
  Network, 
  FileText, 
  ArrowRight, 
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface FlowStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'active' | 'pending';
  layer: string;
  icon: React.ComponentType<any>;
  details: string[];
}

const SystemFlow: React.FC = () => {
  const [activeStep, setActiveStep] = useState<string | null>(null);

  const flowSteps: FlowStep[] = [
    {
      id: 'create-dataset',
      title: 'Create Dataset',
      description: 'User initiates dataset creation via Next.js frontend',
      status: 'completed',
      layer: 'Frontend Demo',
      icon: FileText,
      details: [
        'Next.js + Tailwind + Flow SDK interface',
        'User uploads dataset and metadata',
        'Form validation and preprocessing'
      ]
    },
    {
      id: 'dataverse-persist',
      title: 'Dataverse Persistence',
      description: 'POST to Dataverse REST API, receive DOI/Handle',
      status: 'completed',
      layer: 'Data Platform',
      icon: Database,
      details: [
        'POST /api/datasets to Dataverse',
        'File storage and cataloging',
        'DOI/Handle identifier assignment',
        'Integration with existing academic infrastructure'
      ]
    },
    {
      id: 'metadata-harvest',
      title: 'Metadata Harvesting',
      description: 'BioAgents extract and process raw metadata',
      status: 'active',
      layer: 'Agent Layer',
      icon: Cpu,
      details: [
        'BioAgents automated metadata extraction',
        'Cultural heritage specific processing',
        'Multi-language metadata support',
        'Provenance tracking initialization'
      ]
    },
    {
      id: 'ai-enrichment',
      title: 'AI Enrichment & GDPR Validation',
      description: 'LangChain.js processes metadata with GDPR compliance',
      status: 'active',
      layer: 'Agent Layer',
      icon: Shield,
      details: [
        'LangChain prompts for tagging and translation',
        'GDPR consent rule validation',
        'Verifiable Credential (VC) generation',
        'Cultural sensitivity analysis'
      ]
    },
    {
      id: 'did-minting',
      title: 'DID Minting',
      description: 'Create DID on Flow/NEAR blockchain',
      status: 'pending',
      layer: 'DID Registry',
      icon: Network,
      details: [
        'Flow Cadence or NEAR contract execution',
        'did:flow: or did:near: identifier creation',
        'Metadata fingerprint storage',
        'Audit event emission'
      ]
    },
    {
      id: 'storage-layer',
      title: 'Decentralized Storage',
      description: 'Store DID documents and VCs on IPFS/Filecoin',
      status: 'pending',
      layer: 'Storage Layer',
      icon: Cloud,
      details: [
        'fs-upload-dapp integration',
        'CAR file packaging',
        'Filecoin/IPFS pinning',
        'Content CID generation'
      ]
    }
  ];

  const layers = [
    { name: 'Frontend Demo', color: 'bg-primary-500', description: 'Next.js + Tailwind + Flow SDK' },
    { name: 'Data Platform', color: 'bg-secondary-500', description: 'Dataverse REST API' },
    { name: 'Agent Layer', color: 'bg-accent-500', description: 'BioAgents + LangChain.js' },
    { name: 'DID Registry', color: 'bg-indigo-500', description: 'Flow + NEAR' },
    { name: 'Storage Layer', color: 'bg-purple-500', description: 'IPFS/Filecoin + Lighthouse' }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-secondary-500" />;
      case 'active':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pt-8 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            System Flow Architecture
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            End-to-end DID lifecycle with BioAgents, Dataverse integration, and decentralized storage
          </p>
        </div>

        {/* Layer Legend */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            System Layers
          </h2>
          <div className="grid md:grid-cols-5 gap-4">
            {layers.map((layer, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200 dark:border-gray-700"
              >
                <div className={`w-4 h-4 rounded-full ${layer.color} mb-2`}></div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                  {layer.name}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  {layer.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Flow Steps */}
        <div className="space-y-4">
          {flowSteps.map((step, index) => {
            const Icon = step.icon;
            const layerColor = layers.find(l => l.name === step.layer)?.color || 'bg-gray-500';
            
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div
                  className={`bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 cursor-pointer ${
                    activeStep === step.id ? 'ring-2 ring-primary-500' : ''
                  }`}
                  onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`w-12 h-12 rounded-xl ${layerColor} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {index + 1}. {step.title}
                          </h3>
                          {getStatusIcon(step.status)}
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-2">
                          {step.description}
                        </p>
                        <span className="inline-block px-3 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          {step.layer}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className={`w-5 h-5 text-gray-400 transition-transform ${
                      activeStep === step.id ? 'rotate-90' : ''
                    }`} />
                  </div>

                  {activeStep === step.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                    >
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Implementation Details:
                      </h4>
                      <ul className="space-y-2">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0"></div>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </div>

                {index < flowSteps.length - 1 && (
                  <div className="flex justify-center py-2">
                    <ArrowRight className="w-6 h-6 text-gray-300 dark:text-gray-600 rotate-90" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Integration Points */}
        <div className="mt-12 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Key Integration Points
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                External Systems
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>• <strong>Dataverse:</strong> Academic dataset repository with DOI/Handle</li>
                <li>• <strong>BioAgents:</strong> AI-powered metadata processing and enrichment</li>
                <li>• <strong>Flow/NEAR:</strong> Blockchain networks for DID registry</li>
                <li>• <strong>Filecoin/IPFS:</strong> Decentralized storage for DID documents</li>
                <li>• <strong>OriginTrail DKG:</strong> Knowledge graph for provenance tracking</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                GDPR Compliance Features
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>• <strong>Consent Management:</strong> Granular permission control</li>
                <li>• <strong>Data Portability:</strong> Export in multiple formats</li>
                <li>• <strong>Right to Erasure:</strong> Verifiable data deletion</li>
                <li>• <strong>Audit Trails:</strong> Immutable consent and access logs</li>
                <li>• <strong>Pseudonymization:</strong> Privacy-preserving identifiers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemFlow;