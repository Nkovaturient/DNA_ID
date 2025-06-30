import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Globe, Calendar, Tag, ExternalLink, Database, Users, BookOpen } from 'lucide-react';
import { useDID } from '../contexts/DIDContext';
import { format } from 'date-fns';
import { integrationService } from '../services/integrationService';
import { Dataset } from '../types';

const DatasetExplorer: React.FC = () => {
  const { dids } = useDID();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [datasets, setDatasets] = useState<Dataset[]>([]);

useEffect(() => {
    // Fetch datasets from Dataverse
    const fetchDatasets = async () => {
      try {
        const recentDatasets = await integrationService.searchDatasets('');
        setDatasets(recentDatasets);
      } catch (error) {
        console.error('Failed to fetch datasets:', error);
        // Fallback to DID datasets if Dataverse fails
        const didDatasets = dids.filter((did) => did.metadata?.type === 'dataset');
        const mapData = didDatasets.map(did => ({
          id: did.id,
          persistentId: did.id,
          title: did.metadata.name,
          description: did.metadata.description,
          authors: [{ name: 'DID System', affiliation: '', identifier: '', identifierScheme: '' }],
          subjects: ['Computer and Information Science'],
          keywords: did.metadata.tags.map(tag => ({ value: tag, vocabulary: '', vocabularyURI: '' })),
          created: did.created,
          updated: did.created,
          version: '1.0',
          status: did.status,
          culturalHeritage: did.metadata.culturalHeritage,
          gdprCompliant: did.gdprConsent.granted,
          storageIdentifier: did.storage.ipfsHash,
        }))
        setDatasets(mapData);
      }
    };

    fetchDatasets();
  }, [dids]);

  const filteredDatasets = datasets.filter(dataset => {
    const matchesSearch = dataset.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dataset.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dataset.keywords.some(keyword => keyword.value.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'cultural' && dataset.culturalHeritage) ||
                         (selectedFilter === 'active' && dataset.status === 'published');
    
    return matchesSearch && matchesFilter;
  });

  const mockDatasets = [
    {
      id: 'did:flow:mainnet:0xabcdef123456',
      name: 'Māori Traditional Knowledge Archive',
      description: 'Comprehensive collection of traditional Māori knowledge, stories, and cultural practices digitally preserved for future generations.',
      institution: 'University of Auckland',
      language: 'English, Te Reo Māori',
      size: '2.4 TB',
      records: '15,847',
      lastUpdated: new Date('2024-01-20'),
      tags: ['cultural-heritage', 'indigenous', 'māori', 'traditional-knowledge'],
      culturalHeritage: true,
      doiIntegration: '10.5281/zenodo.7891234',
      accessLevel: 'Restricted',
      license: 'Creative Commons Attribution-NonCommercial 4.0'
    },
    {
      id: 'did:near:mainnet:research.collection.near',
      name: 'European Medieval Manuscripts',
      description: 'High-resolution digitized medieval manuscripts from libraries across Europe, with AI-enhanced metadata and searchable text.',
      institution: 'European Digital Library Consortium',
      language: 'Multiple (Latin, Old French, Middle English)',
      size: '890 GB',
      records: '3,421',
      lastUpdated: new Date('2024-01-18'),
      tags: ['manuscripts', 'medieval', 'european', 'historical', 'texts'],
      culturalHeritage: true,
      doiIntegration: '10.5281/zenodo.7823456',
      accessLevel: 'Open Access',
      license: 'CC0 1.0 Universal'
    },
    {
      id: 'did:flow:mainnet:0x789abc456def',
      name: 'Climate Data Observatory',
      description: 'Real-time and historical climate data from weather stations worldwide, supporting climate research and policy decisions.',
      institution: 'Global Climate Research Institute',
      language: 'English',
      size: '12.8 TB',
      records: '2,847,293',
      lastUpdated: new Date('2024-01-22'),
      tags: ['climate', 'environment', 'weather', 'data', 'research'],
      culturalHeritage: false,
      doiIntegration: '10.5281/zenodo.7934567',
      accessLevel: 'Open Access',
      license: 'Creative Commons Attribution 4.0'
    }
  ];

  const allDatasets = [...filteredDatasets.map(dataset => ({
    id: dataset.id,
    name: dataset.title,
    description: dataset.description,
    institution: dataset.authors?.[0]?.affiliation || 'DID Infrastructure Demo',
    language: 'English',
    size: '1.2 GB',
    records: '5,432',
    lastUpdated: dataset.created,
    tags: dataset.keywords.map(k => k.value),
    culturalHeritage: dataset.culturalHeritage || false,
    doiIntegration: `10.5281/zenodo.${Math.floor(Math.random() * 1000000)}`,
    accessLevel: dataset.gdprCompliant ? 'Open Access' : 'Restricted',
    license: 'Creative Commons Attribution 4.0'
  })), ...mockDatasets];

  return (
    <div className="min-h-screen pt-8 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dataset Explorer
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Discover and explore decentralized datasets with cultural heritage focus
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search datasets, tags, or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Datasets</option>
              <option value="cultural">Cultural Heritage</option>
              <option value="active">Active Only</option>
            </select>
          </div>
        </div>

        <div className="grid gap-6">
          {allDatasets.map((dataset, index) => (
            <motion.div
              key={dataset.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 hover:shadow-xl"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {dataset.name}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <div className="flex items-center space-x-1">
                          <Globe className="w-4 h-4" />
                          <span>{dataset.institution}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{format(dataset.lastUpdated, 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                    {dataset.culturalHeritage && (
                      <span className="px-3 py-1 rounded-full text-xs bg-accent-100 dark:bg-accent-900 text-accent-600 dark:text-accent-400 font-medium">
                        Cultural Heritage
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                    {dataset.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {dataset.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400"
                      >
                        <Tag className="w-3 h-3" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Database className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-300">{dataset.size}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-300">{dataset.records} records</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-300">{dataset.language}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${dataset.accessLevel === 'Open Access' ? 'bg-secondary-500' : 'bg-yellow-500'}`}></span>
                      <span className="text-gray-600 dark:text-gray-300">{dataset.accessLevel}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col space-y-3 lg:min-w-[200px]">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium hover:shadow-lg transition-all duration-300"
                  >
                    <span>Access Dataset</span>
                    <ExternalLink className="w-4 h-4" />
                  </motion.button>
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <p><strong>DOI:</strong> {dataset.doiIntegration}</p>
                    <p><strong>License:</strong> {dataset.license}</p>
                    <p><strong>DID:</strong> {dataset.id.slice(0, 30)}...</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {allDatasets.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No datasets found
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Try adjusting your search terms or filters
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DatasetExplorer;