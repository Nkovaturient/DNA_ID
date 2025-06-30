import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  ExternalLink, 
  Globe, 
  Link, 
  CheckCircle,
  ArrowRight,
  Download,
  Zap,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { dataverseAPI } from '../api/dataverseApi';

interface DataverseDataset {
  id: string;
  title: string;
  doi: string;
  handle: string;
  description: string;
  author: string;
  institution: string;
  datePublished: string;
  fileCount: number;
  size: string;
  subjects: string[];
  didLinked: boolean;
  didId?: string;
  status: 'published' | 'draft' | 'processing';
}

const DataverseIntegration: React.FC = () => {
  // const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [linkingInProgress, setLinkingInProgress] = useState<string | null>(null);
  const [datasets, setDatasets] = useState<DataverseDataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Mock datasets as fallback
  const mockDatasets: DataverseDataset[] = [
    {
      id: 'dv-001',
      title: 'Māori Traditional Knowledge Archive',
      doi: '10.5281/zenodo.7891234',
      handle: 'hdl:1902.1/21919',
      description: 'Comprehensive collection of traditional Māori knowledge, stories, and cultural practices digitally preserved for future generations.',
      author: 'Dr. Sarah Williams',
      institution: 'University of Auckland',
      datePublished: '2024-01-20',
      fileCount: 247,
      size: '2.4 TB',
      subjects: ['Cultural Heritage', 'Indigenous Knowledge', 'Māori Culture', 'Digital Preservation'],
      didLinked: true,
      didId: 'did:flow:mainnet:0xabcdef123456',
      status: 'published'
    },
    {
      id: 'dv-002',
      title: 'European Medieval Manuscripts Collection',
      doi: '10.5281/zenodo.7823456',
      handle: 'hdl:1902.1/21920',
      description: 'High-resolution digitized medieval manuscripts from libraries across Europe, with AI-enhanced metadata and searchable text.',
      author: 'Prof. Elena Rodriguez',
      institution: 'European Digital Library Consortium',
      datePublished: '2024-01-18',
      fileCount: 156,
      size: '890 GB',
      subjects: ['Medieval History', 'Manuscripts', 'European Culture', 'Digital Humanities'],
      didLinked: false,
      status: 'published'
    },
    {
      id: 'dv-003',
      title: 'Pacific Island Oral Histories',
      doi: '10.5281/zenodo.7934567',
      handle: 'hdl:1902.1/21921',
      description: 'Audio recordings and transcriptions of oral histories from Pacific Island communities, preserving traditional narratives.',
      author: 'Dr. James Taumalolo',
      institution: 'Pacific Heritage Institute',
      datePublished: '2024-01-15',
      fileCount: 89,
      size: '1.2 TB',
      subjects: ['Oral History', 'Pacific Islands', 'Cultural Preservation', 'Audio Archives'],
      didLinked: false,
      status: 'processing'
    }
  ];

  // Fetch real datasets from Dataverse
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Test connection first
        const isConnected = await dataverseAPI.testConnection();
        if (!isConnected) {
          throw new Error('Cannot connect to Dataverse endpoint');
        }
        
        // Fetch recent datasets
        const response = await dataverseAPI.getRecentDatasets(20);
        const dataverseDatasets = response.data?.items?.map((item: any) => ({
          id: item.entity_id?.toString() || `dv-${Date.now()}`,
          title: item.name || 'Untitled Dataset',
          doi: item.global_id || `10.5281/zenodo.${Math.floor(Math.random() * 1000000)}`,
          handle: item.persistentUrl || `hdl:1902.1/${Math.floor(Math.random() * 100000)}`,
          description: item.description || 'No description available',
          author: item.authors?.[0] || 'Unknown Author',
          institution: item.affiliation || 'Unknown Institution',
          datePublished: item.published_at || new Date().toISOString().split('T')[0],
          fileCount: Math.floor(Math.random() * 500) + 1,
          size: `${(Math.random() * 10 + 0.1).toFixed(1)} GB`,
          subjects: item.subjects || ['General'],
          didLinked: Math.random() > 0.7, // Randomly assign some as linked
          didId: Math.random() > 0.7 ? `did:flow:testnet:${Math.random().toString(36).substring(7)}` : undefined,
          status: 'published' as const
        })) || [];
        
        // Combine with mock data for demo
        setDatasets([...dataverseDatasets, ...mockDatasets]);
        setLastRefresh(new Date());
      } catch (error: any) {
        console.error('Failed to fetch datasets:', error);
        setError(error.message);
        // Fallback to mock data
        setDatasets(mockDatasets);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDatasets();
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchDatasets, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    window.location.reload(); // Simple refresh for now
  };

  const handleLinkDID = async (datasetId: string) => {
    setLinkingInProgress(datasetId);
    
    // Simulate DID linking process
    setTimeout(() => {
      setLinkingInProgress(null);
      // In real implementation, this would update the dataset with DID
      console.log(`Linked DID to dataset ${datasetId}`);
    }, 3000);
  };

  const integrationSteps = [
    {
      title: 'Dataset Discovery',
      description: 'Automatically discover new datasets in Dataverse repositories',
      icon: Database,
      status: 'active'
    },
    {
      title: 'Metadata Extraction',
      description: 'Extract structured metadata using Dataverse REST API',
      icon: Download,
      status: 'active'
    },
    {
      title: 'BioAgent Processing',
      description: 'Process metadata through AI agents for enrichment',
      icon: Zap,
      status: 'active'
    },
    {
      title: 'DID Creation',
      description: 'Generate DID with enriched metadata and link to dataset',
      icon: Link,
      status: 'pending'
    }
  ];

  return (
    <div className="min-h-screen pt-8 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Dataverse Integration
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Seamless integration with academic data repositories and persistent identifier systems
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </motion.button>
            </div>
          </div>
          
          {/* Status Bar */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${error ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {error ? 'Disconnected' : 'Connected to Dataverse'}
                  </span>
                </div>
                {error && (
                  <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <span>Datasets: {datasets.length}</span>
                <span>Last refresh: {lastRefresh.toLocaleTimeString()}</span>
                {isLoading && (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Integration Process */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Integration Process
          </h2>
          
          <div className="grid md:grid-cols-4 gap-4">
            {integrationSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    step.status === 'active' 
                      ? 'bg-gradient-to-r from-primary-500 to-accent-500' 
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {step.description}
                  </p>
                  {index < integrationSteps.length - 1 && (
                    <ArrowRight className="w-6 h-6 text-gray-300 dark:text-gray-600 mx-auto mt-4 hidden md:block" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Dataverse Datasets */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Connected Dataverse Repositories
          </h2>
          
          {datasets.map((dataset, index) => (
            <motion.div
              key={dataset.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {dataset.title}
                    </h3>
                    {dataset.didLinked && (
                      <span className="px-3 py-1 rounded-full text-xs bg-secondary-100 dark:bg-secondary-900 text-secondary-600 dark:text-secondary-400 font-medium flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>DID Linked</span>
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      dataset.status === 'published' 
                        ? 'bg-secondary-100 dark:bg-secondary-900 text-secondary-600 dark:text-secondary-400'
                        : dataset.status === 'processing'
                        ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {dataset.status.charAt(0).toUpperCase() + dataset.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300 mb-3">
                    <div>
                      <p><strong>Author:</strong> {dataset.author}</p>
                      <p><strong>Institution:</strong> {dataset.institution}</p>
                      <p><strong>Published:</strong> {dataset.datePublished}</p>
                    </div>
                    <div>
                      <p><strong>Files:</strong> {dataset.fileCount}</p>
                      <p><strong>Size:</strong> {dataset.size}</p>
                      <p><strong>DOI:</strong> {dataset.doi}</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {dataset.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {dataset.subjects.map((subject, subIndex) => (
                      <span
                        key={subIndex}
                        className="px-3 py-1 rounded-full text-sm bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm">
                    <a
                      href={`https://doi.org/${dataset.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>View DOI</span>
                    </a>
                    <a
                      href={`https://hdl.handle.net/${dataset.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                    >
                      <Globe className="w-4 h-4" />
                      <span>Handle</span>
                    </a>
                    {dataset.didLinked && dataset.didId && (
                      <span className="flex items-center space-x-1 text-secondary-600 dark:text-secondary-400">
                        <Link className="w-4 h-4" />
                        <span>DID: {dataset.didId.slice(0, 30)}...</span>
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="ml-6">
                  {!dataset.didLinked && dataset.status === 'published' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleLinkDID(dataset.id)}
                      disabled={linkingInProgress === dataset.id}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                    >
                      {linkingInProgress === dataset.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Linking...</span>
                        </>
                      ) : (
                        <>
                          <Link className="w-4 h-4" />
                          <span>Link DID</span>
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DataverseIntegration;