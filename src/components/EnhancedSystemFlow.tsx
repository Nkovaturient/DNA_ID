import React, { useState, useEffect } from 'react';
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
  AlertTriangle,
  Brain,
  Zap,
  Globe,
  Lock
} from 'lucide-react';

interface EnhancedFlowStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'active' | 'pending' | 'failed';
  layer: string;
  icon: React.ComponentType<any>;
  details: string[];
  enhancements: string[];
  duration?: number;
  progress?: number;
}

const EnhancedSystemFlow: React.FC = () => {
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const enhancedFlowSteps: EnhancedFlowStep[] = [
    {
      id: 'metadata-input',
      title: 'Enhanced Metadata Input',
      description: 'User provides dataset metadata with cultural heritage context',
      status: 'completed',
      layer: 'Frontend Interface',
      icon: FileText,
      details: [
        'React + TypeScript interface with validation',
        'Multi-file upload support (up to 500MB)',
        'Cultural heritage specific fields',
        'GDPR consent collection'
      ],
      enhancements: [
        'Real-time validation',
        'Cultural sensitivity prompts',
        'Accessibility guidelines',
        'Multi-language support'
      ],
      duration: 2.5,
      progress: 100
    },
    {
      id: 'bioagents-harvest',
      title: 'BioAgents Metadata Harvesting',
      description: 'AI agents extract and validate metadata from Dataverse',
      status: 'active',
      layer: 'AI Processing Layer',
      icon: Brain,
      details: [
        'Dataverse API integration',
        'Automated metadata extraction',
        'Quality assessment scoring',
        'Provenance tracking'
      ],
      enhancements: [
        'Cultural context analysis',
        'Sensitivity detection',
        'Multi-source harvesting',
        'Real-time quality metrics'
      ],
      duration: 8.3,
      progress: 67
    },
    {
      id: 'ai-enrichment',
      title: 'AI-Powered Metadata Enrichment',
      description: 'LangChain.js processes metadata with cultural sensitivity',
      status: 'pending',
      layer: 'AI Processing Layer',
      icon: Zap,
      details: [
        'GPT-4 powered analysis',
        'Cultural heritage specialization',
        'GDPR compliance validation',
        'Semantic tagging and entity extraction'
      ],
      enhancements: [
        'Multi-language processing',
        'Accessibility analysis',
        'Community relevance scoring',
        'Automated translations'
      ],
      duration: 0,
      progress: 0
    },
    {
      id: 'veramo-did-creation',
      title: 'Veramo DID Creation',
      description: 'W3C compliant DID creation with Ethereum integration',
      status: 'pending',
      layer: 'Identity Layer',
      icon: Shield,
      details: [
        'Veramo framework integration',
        'Ethereum DID method (did:ethr)',
        'Key management and storage',
        'DID document generation'
      ],
      enhancements: [
        'Enhanced metadata embedding',
        'Cultural heritage markers',
        'GDPR compliance flags',
        'Service endpoint configuration'
      ],
      duration: 0,
      progress: 0
    },
    {
      id: 'credential-issuance',
      title: 'Verifiable Credential Issuance',
      description: 'Issue W3C compliant credentials with enriched metadata',
      status: 'pending',
      layer: 'Identity Layer',
      icon: FileText,
      details: [
        'W3C VC standard compliance',
        'Digital signature with Ethereum keys',
        'Credential subject population',
        'Proof generation and validation'
      ],
      enhancements: [
        'Cultural heritage credential types',
        'Evidence linking',
        'Expiration management',
        'Revocation registry'
      ],
      duration: 0,
      progress: 0
    },
    {
      id: 'powergate-storage',
      title: 'Textile Powergate Storage',
      description: 'Store DID documents and credentials on Filecoin via IPFS',
      status: 'pending',
      layer: 'Storage Layer',
      icon: Database,
      details: [
        'Textile Powergate client integration',
        'IPFS hot storage for fast access',
        'Filecoin cold storage for permanence',
        'Deal monitoring and verification'
      ],
      enhancements: [
        'Optimized storage configurations',
        'Cost-effective deal parameters',
        'Redundancy and replication',
        'Storage job monitoring'
      ],
      duration: 0,
      progress: 0
    },
    {
      id: 'provenance-tracking',
      title: 'Provenance & Audit Trail',
      description: 'Complete audit trail with immutable provenance records',
      status: 'pending',
      layer: 'Compliance Layer',
      icon: Network,
      details: [
        'Immutable audit trail creation',
        'Provenance graph generation',
        'GDPR compliance logging',
        'Cultural sensitivity markers'
      ],
      enhancements: [
        'Real-time compliance monitoring',
        'Automated reporting',
        'Privacy-preserving logs',
        'Community notification system'
      ],
      duration: 0,
      progress: 0
    }
  ];

  const layers = [
    { 
      name: 'Frontend Interface', 
      color: 'bg-primary-500', 
      description: 'React + TypeScript + Enhanced UX',
      enhancements: ['Real-time validation', 'Cultural prompts', 'Accessibility']
    },
    { 
      name: 'AI Processing Layer', 
      color: 'bg-secondary-500', 
      description: 'BioAgents + LangChain.js + GPT-4',
      enhancements: ['Cultural analysis', 'GDPR validation', 'Quality scoring']
    },
    { 
      name: 'Identity Layer', 
      color: 'bg-accent-500', 
      description: 'Veramo + Ethereum + W3C Standards',
      enhancements: ['Enhanced metadata', 'Cultural markers', 'Compliance flags']
    },
    { 
      name: 'Storage Layer', 
      color: 'bg-indigo-500', 
      description: 'Textile Powergate + IPFS + Filecoin',
      enhancements: ['Optimized configs', 'Cost efficiency', 'Monitoring']
    },
    { 
      name: 'Compliance Layer', 
      color: 'bg-purple-500', 
      description: 'GDPR + Cultural Heritage + Audit',
      enhancements: ['Real-time monitoring', 'Privacy preservation', 'Community alerts']
    }
  ];

  // Simulate workflow execution
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < enhancedFlowSteps.length - 1) {
            return prev + 1;
          } else {
            setIsRunning(false);
            return prev;
          }
        });
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isRunning]);

  const startWorkflow = () => {
    setIsRunning(true);
    setCurrentStep(0);
  };

  const getStatusIcon = (status: string, isCurrentStep: boolean) => {
    if (isCurrentStep && isRunning) {
      return <Clock className="w-5 h-5 text-yellow-500 animate-spin" />;
    }
    
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-secondary-500" />;
      case 'active':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'failed':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pt-8 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Enhanced System Flow
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Complete DNA_ID workflow with Veramo, BioAgents, and Textile Powergate
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startWorkflow}
              disabled={isRunning}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold hover:shadow-xl transition-all duration-300 disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Running Workflow...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>Start Enhanced Workflow</span>
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Enhanced Layer Legend */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Enhanced System Architecture
          </h2>
          <div className="grid md:grid-cols-5 gap-4">
            {layers.map((layer, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className={`w-4 h-4 rounded-full ${layer.color} mb-2`}></div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                  {layer.name}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                  {layer.description}
                </p>
                <div className="space-y-1">
                  {layer.enhancements.map((enhancement, enhIndex) => (
                    <div key={enhIndex} className="flex items-center space-x-1">
                      <div className="w-1 h-1 rounded-full bg-accent-500"></div>
                      <span className="text-xs text-accent-600 dark:text-accent-400">{enhancement}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Enhanced Flow Steps */}
        <div className="space-y-4">
          {enhancedFlowSteps.map((step, index) => {
            const Icon = step.icon;
            const layerColor = layers.find(l => l.name === step.layer)?.color || 'bg-gray-500';
            const isCurrentStep = isRunning && index === currentStep;
            const isCompleted = isRunning && index < currentStep;
            
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div
                  className={`bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border transition-all duration-300 cursor-pointer ${
                    activeStep === step.id 
                      ? 'ring-2 ring-primary-500 border-primary-300 dark:border-primary-600' 
                      : isCurrentStep
                      ? 'ring-2 ring-yellow-500 border-yellow-300 dark:border-yellow-600'
                      : isCompleted
                      ? 'ring-2 ring-secondary-500 border-secondary-300 dark:border-secondary-600'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600'
                  }`}
                  onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`w-12 h-12 rounded-xl ${layerColor} flex items-center justify-center relative`}>
                        <Icon className="w-6 h-6 text-white" />
                        {isCurrentStep && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          </div>
                        )}
                        {isCompleted && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-secondary-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {index + 1}. {step.title}
                          </h3>
                          {getStatusIcon(step.status, isCurrentStep)}
                          {step.duration && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {step.duration}s
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-2">
                          {step.description}
                        </p>
                        <div className="flex items-center space-x-4">
                          <span className="inline-block px-3 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            {step.layer}
                          </span>
                          {step.enhancements.length > 0 && (
                            <span className="inline-block px-3 py-1 rounded-full text-xs bg-accent-100 dark:bg-accent-900 text-accent-600 dark:text-accent-400">
                              {step.enhancements.length} Enhancements
                            </span>
                          )}
                        </div>
                        
                        {/* Progress Bar for Active Step */}
                        {isCurrentStep && step.progress !== undefined && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                              <span>Processing...</span>
                              <span>{step.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <motion.div
                                className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${step.progress}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                          </div>
                        )}
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
                      className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"
                    >
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                            <Cpu className="w-4 h-4" />
                            <span>Core Implementation</span>
                          </h4>
                          <ul className="space-y-2">
                            {step.details.map((detail, detailIndex) => (
                              <li key={detailIndex} className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-300">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0"></div>
                                <span>{detail}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                            <Zap className="w-4 h-4" />
                            <span>Enhanced Features</span>
                          </h4>
                          <ul className="space-y-2">
                            {step.enhancements.map((enhancement, enhIndex) => (
                              <li key={enhIndex} className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-300">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent-500 mt-2 flex-shrink-0"></div>
                                <span>{enhancement}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {index < enhancedFlowSteps.length - 1 && (
                  <div className="flex justify-center py-2">
                    <ArrowRight className={`w-6 h-6 rotate-90 transition-colors ${
                      isCompleted || (isRunning && index < currentStep) 
                        ? 'text-secondary-500' 
                        : isCurrentStep 
                        ? 'text-yellow-500' 
                        : 'text-gray-300 dark:text-gray-600'
                    }`} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Enhanced Integration Points */}
        <div className="mt-12 grid md:grid-cols-2 gap-8">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
              <Globe className="w-5 h-5" />
              <span>Enhanced Integrations</span>
            </h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Veramo Framework</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">W3C compliant DID and VC management</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-secondary-50 dark:bg-secondary-900/20">
                <Brain className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Enhanced BioAgents</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">AI-powered metadata processing with cultural awareness</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-accent-50 dark:bg-accent-900/20">
                <Database className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Textile Powergate</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Optimized Filecoin storage with IPFS gateway</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
              <Lock className="w-5 h-5" />
              <span>Enhanced Compliance</span>
            </h2>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-secondary-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Cultural Heritage Protection</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">AI-powered sensitivity analysis and community guidelines</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-secondary-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">GDPR Automation</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Automated compliance checking and consent management</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-secondary-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Immutable Audit Trail</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Complete provenance tracking with blockchain verification</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-secondary-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Data Portability</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Export in multiple formats with verifiable credentials</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        {isRunning && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-2xl p-6 border border-primary-200 dark:border-primary-800"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span>Real-time Workflow Metrics</span>
            </h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {currentStep + 1}/{enhancedFlowSteps.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Steps Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary-600 dark:text-secondary-400">
                  {Math.round(((currentStep + 1) / enhancedFlowSteps.length) * 100)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent-600 dark:text-accent-400">
                  {enhancedFlowSteps.slice(0, currentStep + 1).reduce((sum, step) => sum + (step.duration || 0), 0).toFixed(1)}s
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {currentStep >= 3 ? '1' : '0'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">DIDs Created</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EnhancedSystemFlow;