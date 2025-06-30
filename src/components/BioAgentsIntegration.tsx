import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Cpu, 
  Brain, 
  Languages, 
  Shield, 
  Zap, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  FileText,
  Globe,
  Database
} from 'lucide-react';

interface AgentTask {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed' | 'queued';
  progress: number;
  description: string;
  output?: string;
  duration: number;
}

const BioAgentsIntegration: React.FC = () => {
  const [agents, setAgents] = useState<AgentTask[]>([
    {
      id: 'metadata-extractor',
      name: 'Metadata Extraction Agent',
      status: 'completed',
      progress: 100,
      description: 'Extracting structured metadata from cultural heritage datasets',
      output: 'Extracted 247 metadata fields, identified 12 cultural categories',
      duration: 2.3
    },
    {
      id: 'gdpr-validator',
      name: 'GDPR Compliance Validator',
      status: 'running',
      progress: 67,
      description: 'Validating consent requirements and data processing legality',
      duration: 1.8
    },
    {
      id: 'cultural-enricher',
      name: 'Cultural Context Enricher',
      status: 'queued',
      progress: 0,
      description: 'Adding cultural context and sensitivity markers',
      duration: 0
    },
    {
      id: 'language-processor',
      name: 'Multi-language Processor',
      status: 'queued',
      progress: 0,
      description: 'Processing metadata in multiple languages for accessibility',
      duration: 0
    }
  ]);

  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setAgents(prev => prev.map(agent => {
        if (agent.status === 'running' && agent.progress < 100) {
          const newProgress = Math.min(agent.progress + Math.random() * 10, 100);
          return {
            ...agent,
            progress: newProgress,
            duration: agent.duration + 0.1,
            status: newProgress >= 100 ? 'completed' : 'running',
            output: newProgress >= 100 ? 'Processing completed successfully' : agent.output
          };
        }
        return agent;
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-secondary-500" />;
      case 'running':
        return <Clock className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'failed':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'queued':
        return <Clock className="w-5 h-5 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-secondary-100 dark:bg-secondary-900 text-secondary-600 dark:text-secondary-400';
      case 'running':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400';
      case 'queued':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    }
  };

  const bioAgentsFeatures = [
    {
      icon: Brain,
      title: 'AI-Powered Metadata Processing',
      description: 'Automated extraction and enrichment of dataset metadata using advanced NLP',
      capabilities: ['Entity recognition', 'Semantic tagging', 'Content classification', 'Quality assessment']
    },
    {
      icon: Languages,
      title: 'Multi-language Support',
      description: 'Process and translate metadata across multiple languages for global accessibility',
      capabilities: ['Language detection', 'Translation services', 'Cultural adaptation', 'Unicode handling']
    },
    {
      icon: Shield,
      title: 'GDPR Compliance Automation',
      description: 'Automated validation of data processing against GDPR requirements',
      capabilities: ['Consent validation', 'Data minimization', 'Purpose limitation', 'Audit trail generation']
    },
    {
      icon: Globe,
      title: 'Cultural Heritage Specialization',
      description: 'Specialized processing for cultural heritage datasets with sensitivity awareness',
      capabilities: ['Cultural context analysis', 'Sensitivity detection', 'Provenance tracking', 'Community guidelines']
    }
  ];

  return (
    <div className="min-h-screen pt-8 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            BioAgents Integration
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            AI-powered agents for automated metadata processing and GDPR compliance
          </p>
        </div>

        {/* BioAgents Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {bioAgentsFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                  {feature.description}
                </p>
                <ul className="space-y-1">
                  {feature.capabilities.map((capability, capIndex) => (
                    <li key={capIndex} className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                      <div className="w-1 h-1 rounded-full bg-primary-500"></div>
                      <span>{capability}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* Active Agents */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Active Agent Tasks
          </h2>
          
          <div className="space-y-4">
            {agents.map((agent) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                  selectedAgent === agent.id 
                    ? 'border-primary-300 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/20' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
                onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(agent.status)}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {agent.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {agent.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}>
                      {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                    </span>
                    {agent.duration > 0 && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {agent.duration.toFixed(1)}s
                      </span>
                    )}
                  </div>
                </div>

                {agent.status !== 'queued' && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                      <span>Progress</span>
                      <span>{Math.round(agent.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <motion.div
                        className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${agent.progress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                )}

                {selectedAgent === agent.id && agent.output && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                  >
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>Output</span>
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {agent.output}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Integration Architecture */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            BioAgents Architecture Integration
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center mx-auto mb-4">
                <Database className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Data Ingestion
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Automated harvesting from Dataverse and other academic repositories
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-secondary-500 to-primary-500 flex items-center justify-center mx-auto mb-4">
                <Cpu className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                AI Processing
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                LangChain.js powered agents for metadata enrichment and validation
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-accent-500 to-secondary-500 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                DID Creation
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Automated DID minting with enriched metadata and compliance verification
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BioAgentsIntegration;