import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Shield, 
  Trash2, 
  Eye, 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Database,
  Brain,
  Zap,
  FileText,
  Download,
  Upload,
  Cpu,
  Globe
} from 'lucide-react';
import { format } from 'date-fns';

interface EnhancedDID {
  id: string;
  method: string;
  network: string;
  subject: string;
  created: Date;
  status: 'active' | 'revoked' | 'suspended';
  metadata: {
    name: string;
    description: string;
    type: 'dataset' | 'researcher' | 'institution';
    tags: string[];
    culturalHeritage: boolean;
    enrichment?: {
      culturalContext?: any;
      qualityAssessment?: any;
      gdprCompliance?: any;
      semanticTags?: any;
    };
  };
  storage: {
    ipfsHash: string;
    filecoinDeal?: string;
    credentialCid?: string;
    files?: Array<{
      filename: string;
      cid: string;
      size: number;
      mimetype: string;
    }>;
  };
  gdprConsent: {
    granted: boolean;
    timestamp: Date;
    purposes: string[];
  };
  verifiableCredentials: any[];
  compliance: {
    culturalHeritage: boolean;
    gdprCompliant: boolean;
    qualityScore: number;
  };
}

const EnhancedDIDManager: React.FC = () => {
  const [dids, setDids] = useState<EnhancedDID[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedDID, setSelectedDID] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    method: 'ethr' as 'ethr',
    network: 'goerli' as 'goerli',
    name: '',
    description: '',
    type: 'dataset' as 'dataset' | 'researcher' | 'institution',
    tags: '',
    culturalHeritage: false,
    gdprConsent: false,
    purposes: [] as string[],
    author: '',
    authorAffiliation: '',
    contactEmail: '',
    subject: 'Cultural Heritage' as string,
    keywords: '',
    language: 'en',
    files: [] as File[]
  });

  // Load DIDs on component mount
  useEffect(() => {
    loadDIDs();
  }, []);

  const loadDIDs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:3001/api/enhanced-did/list');
      const result = await response.json();
      
      if (result.success) {
        // Transform backend data to component format
        const transformedDIDs = result.dids.map((did: any) => ({
          id: did.did,
          method: did.metadata.method,
          network: did.metadata.network,
          subject: did.did.split(':').pop(),
          created: new Date(did.created || Date.now()),
          status: 'active' as const,
          metadata: {
            name: did.alias || 'Enhanced DID',
            description: 'DID created with enhanced features',
            type: 'dataset' as const,
            tags: ['enhanced', 'veramo', 'filecoin'],
            culturalHeritage: did.metadata.culturalHeritage,
            enrichment: {}
          },
          storage: {
            ipfsHash: 'enhanced-storage',
            filecoinDeal: 'enhanced-deal'
          },
          gdprConsent: {
            granted: did.metadata.gdprCompliant,
            timestamp: new Date(did.created || Date.now()),
            purposes: ['did-creation', 'storage']
          },
          verifiableCredentials: [],
          compliance: {
            culturalHeritage: did.metadata.culturalHeritage,
            gdprCompliant: did.metadata.gdprCompliant,
            qualityScore: 85
          }
        }));
        
        setDids(transformedDIDs);
      }
    } catch (error) {
      console.error('Failed to load DIDs:', error);
      setError('Failed to load DIDs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDID = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Create FormData for multipart upload
      const formDataToSend = new FormData();
      
      // Add metadata
      const metadata = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        culturalHeritage: formData.culturalHeritage,
        author: formData.author,
        authorAffiliation: formData.authorAffiliation,
        contactEmail: formData.contactEmail,
        subject: formData.subject,
        keywords: formData.keywords.split(',').map(kw => kw.trim()).filter(Boolean),
        language: formData.language
      };

      formDataToSend.append('method', formData.method);
      formDataToSend.append('network', formData.network);
      formDataToSend.append('metadata', JSON.stringify(metadata));
      formDataToSend.append('gdprConsent', JSON.stringify({
        granted: formData.gdprConsent,
        purposes: formData.purposes,
        lawfulBasis: 'consent'
      }));

      // Add files
      formData.files.forEach((file, index) => {
        formDataToSend.append('files', file);
      });

      const response = await fetch('http://localhost:3001/api/enhanced-did/create', {
        method: 'POST',
        body: formDataToSend
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'DID creation failed');
      }

      // Add new DID to list
      const newDID: EnhancedDID = {
        id: result.data.id,
        method: result.data.method,
        network: result.data.network,
        subject: result.data.subject,
        created: new Date(result.data.created),
        status: result.data.status,
        metadata: {
          ...result.data.metadata,
          enrichment: result.data.metadata.enrichment
        },
        storage: result.data.storage,
        gdprConsent: {
          granted: result.data.gdprConsent.granted,
          timestamp: new Date(result.data.gdprConsent.timestamp),
          purposes: result.data.gdprConsent.purposes
        },
        verifiableCredentials: result.data.verifiableCredentials || [],
        compliance: result.data.compliance
      };

      setDids(prev => [...prev, newDID]);
      setShowCreateForm(false);
      
      // Reset form
      setFormData({
        method: 'ethr',
        network: 'goerli',
        name: '',
        description: '',
        type: 'dataset',
        tags: '',
        culturalHeritage: false,
        gdprConsent: false,
        purposes: [],
        author: '',
        authorAffiliation: '',
        contactEmail: '',
        subject: 'Cultural Heritage',
        keywords: '',
        language: 'en',
        files: []
      });

    } catch (error) {
      console.error('DID creation failed:', error);
      setError(error instanceof Error ? error.message : 'DID creation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeDID = async (didId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/enhanced-did/revoke/${encodeURIComponent(didId)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: 'user_request',
          userConsent: true,
          removeFromStorage: false
        })
      });

      const result = await response.json();

      if (result.success) {
        setDids(prev => prev.map(did => 
          did.id === didId ? { ...did, status: 'revoked' as const } : did
        ));
      }
    } catch (error) {
      console.error('DID revocation failed:', error);
      setError('Failed to revoke DID');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({ ...prev, files }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-secondary-500" />;
      case 'revoked':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'suspended':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Shield className="w-5 h-5 text-gray-500" />;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen pt-8 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Enhanced DID Manager
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Create and manage DIDs with Veramo, AI enrichment, and Filecoin storage
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateForm(true)}
            disabled={isLoading}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold hover:shadow-xl transition-all duration-300 disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            <span>Create Enhanced DID</span>
          </motion.button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          >
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 dark:text-red-300">{error}</span>
            </div>
          </motion.div>
        )}

        {/* Enhanced Features Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Veramo Integration</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">W3C compliant DIDs</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-secondary-100 dark:bg-secondary-900 flex items-center justify-center">
                <Brain className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">AI Enrichment</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">BioAgents processing</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-accent-900 flex items-center justify-center">
                <Database className="w-5 h-5 text-accent-600 dark:text-accent-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Filecoin Storage</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Powergate integration</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">GDPR Compliant</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Privacy by design</p>
              </div>
            </div>
          </div>
        </div>

        {/* DIDs List */}
        <div className="grid gap-6 mb-8">
          {isLoading && dids.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading enhanced DIDs...</p>
            </div>
          ) : dids.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Enhanced DIDs Found
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Create your first enhanced DID with AI enrichment and Filecoin storage
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold hover:shadow-lg transition-all duration-300"
              >
                Create Enhanced DID
              </button>
            </div>
          ) : (
            dids.map((did) => (
              <motion.div
                key={did.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(did.status)}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {did.metadata.name}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>{did.metadata.type}</span>
                        <span>•</span>
                        <span>{did.method.toUpperCase()}</span>
                        <span>•</span>
                        <span>{did.network}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Quality Score */}
                    <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-secondary-100 dark:bg-secondary-900 text-secondary-600 dark:text-secondary-400">
                      <Zap className="w-3 h-3" />
                      <span className="text-xs font-medium">{did.compliance.qualityScore}%</span>
                    </div>
                    
                    {/* Action Buttons */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedDID(selectedDID === did.id ? null : did.id)}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => copyToClipboard(did.id)}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </motion.button>
                    {did.status === 'active' && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleRevokeDID(did.id)}
                        className="p-2 rounded-lg bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {did.metadata.description}
                </p>

                {/* Enhanced Features Display */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {did.metadata.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full text-sm bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400"
                    >
                      {tag}
                    </span>
                  ))}
                  {did.metadata.culturalHeritage && (
                    <span className="px-3 py-1 rounded-full text-sm bg-accent-100 dark:bg-accent-900 text-accent-600 dark:text-accent-400">
                      Cultural Heritage
                    </span>
                  )}
                  {did.compliance.gdprCompliant && (
                    <span className="px-3 py-1 rounded-full text-sm bg-secondary-100 dark:bg-secondary-900 text-secondary-600 dark:text-secondary-400">
                      GDPR Compliant
                    </span>
                  )}
                  {did.metadata.enrichment && (
                    <span className="px-3 py-1 rounded-full text-sm bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 flex items-center space-x-1">
                      <Brain className="w-3 h-3" />
                      <span>AI Enriched</span>
                    </span>
                  )}
                </div>

                <AnimatePresence>
                  {selectedDID === did.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4"
                    >
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center space-x-1">
                            <Shield className="w-4 h-4" />
                            <span>Identity Details</span>
                          </h4>
                          <div className="space-y-1">
                            <p><span className="text-gray-500">DID:</span> {did.id}</p>
                            <p><span className="text-gray-500">Subject:</span> {did.subject}</p>
                            <p><span className="text-gray-500">Created:</span> {format(did.created, 'PPp')}</p>
                            <p><span className="text-gray-500">Status:</span> {did.status}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center space-x-1">
                            <Database className="w-4 h-4" />
                            <span>Storage</span>
                          </h4>
                          <div className="space-y-1">
                            <p><span className="text-gray-500">IPFS:</span> {did.storage.ipfsHash.slice(0, 20)}...</p>
                            {did.storage.filecoinDeal && (
                              <p><span className="text-gray-500">Filecoin:</span> {did.storage.filecoinDeal.slice(0, 20)}...</p>
                            )}
                            {did.storage.credentialCid && (
                              <p><span className="text-gray-500">Credential:</span> {did.storage.credentialCid.slice(0, 20)}...</p>
                            )}
                            {did.storage.files && did.storage.files.length > 0 && (
                              <p><span className="text-gray-500">Files:</span> {did.storage.files.length} stored</p>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center space-x-1">
                            <Cpu className="w-4 h-4" />
                            <span>AI Enhancement</span>
                          </h4>
                          <div className="space-y-1">
                            <p><span className="text-gray-500">Quality Score:</span> {did.compliance.qualityScore}%</p>
                            <p><span className="text-gray-500">Cultural Heritage:</span> {did.compliance.culturalHeritage ? 'Yes' : 'No'}</p>
                            <p><span className="text-gray-500">GDPR Compliant:</span> {did.compliance.gdprCompliant ? 'Yes' : 'No'}</p>
                            <p><span className="text-gray-500">VCs:</span> {did.verifiableCredentials.length}</p>
                          </div>
                        </div>
                      </div>
                      
                      {did.metadata.enrichment && (
                        <div className="mt-4 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                          <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center space-x-1">
                            <Brain className="w-4 h-4" />
                            <span>AI Enrichment Applied</span>
                          </h4>
                          <div className="grid md:grid-cols-2 gap-2 text-xs">
                            {did.metadata.enrichment.culturalContext && (
                              <div className="flex items-center space-x-1">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                <span>Cultural Context Analysis</span>
                              </div>
                            )}
                            {did.metadata.enrichment.qualityAssessment && (
                              <div className="flex items-center space-x-1">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                <span>Quality Assessment</span>
                              </div>
                            )}
                            {did.metadata.enrichment.gdprCompliance && (
                              <div className="flex items-center space-x-1">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                <span>GDPR Compliance Check</span>
                              </div>
                            )}
                            {did.metadata.enrichment.semanticTags && (
                              <div className="flex items-center space-x-1">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                <span>Semantic Tagging</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>

        {/* Create DID Form */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowCreateForm(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
                  <Zap className="w-6 h-6 text-primary-500" />
                  <span>Create Enhanced DID</span>
                </h2>

                <div className="space-y-6">
                  {/* Method and Network */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        DID Method
                      </label>
                      <select
                        value={formData.method}
                        onChange={(e) => setFormData(prev => ({ ...prev, method: e.target.value as 'ethr' }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="ethr">Ethereum (ethr)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Network
                      </label>
                      <select
                        value={formData.network}
                        onChange={(e) => setFormData(prev => ({ ...prev, network: e.target.value as 'goerli' }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="goerli">Goerli Testnet</option>
                      </select>
                    </div>
                  </div>

                  {/* Basic Information */}
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Enter DID name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description *
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Enter description"
                        required
                      />
                    </div>
                  </div>

                  {/* Enhanced Metadata */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                      <Brain className="w-5 h-5 mr-2" />
                      Enhanced Metadata (AI Processing)
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Author *
                        </label>
                        <input
                          type="text"
                          value={formData.author}
                          onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Author name"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Contact Email *
                        </label>
                        <input
                          type="email"
                          value={formData.contactEmail}
                          onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="contact@example.com"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Keywords
                        </label>
                        <input
                          type="text"
                          value={formData.keywords}
                          onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="keyword1, keyword2, keyword3"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Tags
                        </label>
                        <input
                          type="text"
                          value={formData.tags}
                          onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="tag1, tag2, tag3"
                        />
                      </div>
                    </div>
                  </div>

                  {/* File Upload */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                      <Upload className="w-5 h-5 mr-2" />
                      File Upload (Filecoin Storage)
                    </h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Dataset Files
                      </label>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                        accept=".csv,.json,.xml,.txt,.pdf,.zip,.jpg,.png,.mp3,.mp4"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Multiple files supported. Will be stored on Filecoin via Powergate.
                      </p>
                      {formData.files.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {formData.files.map((file, index) => (
                            <div key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-center space-x-2">
                              <FileText className="w-3 h-3" />
                              <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Compliance Options */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Compliance & Privacy
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="culturalHeritage"
                          checked={formData.culturalHeritage}
                          onChange={(e) => setFormData(prev => ({ ...prev, culturalHeritage: e.target.checked }))}
                          className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="culturalHeritage" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Cultural Heritage Dataset (Enhanced AI analysis)
                        </label>
                      </div>

                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="gdprConsent"
                          checked={formData.gdprConsent}
                          onChange={(e) => setFormData(prev => ({ ...prev, gdprConsent: e.target.checked }))}
                          className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="gdprConsent" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Grant GDPR Consent for AI processing and storage
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-4 mt-8">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCreateDID}
                    disabled={!formData.name || !formData.description || !formData.author || !formData.contactEmail || isLoading}
                    className="flex items-center space-x-2 px-6 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Create Enhanced DID</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EnhancedDIDManager;