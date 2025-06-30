import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Database, Shield, FileText, Clock, ArrowRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { 
  closeSearch, 
  setSearchQuery, 
  setSearchResults,
  setActiveSection 
} from '../../store/slices/navigationSlice';
import { integrationService } from '../../services/integrationService';

interface SearchResult {
  id: string;
  type: 'did' | 'dataset' | 'page';
  title: string;
  description: string;
  path: string;
  icon: React.ComponentType<any>;
  metadata?: any;
}

const SearchModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isSearchOpen, searchQuery, searchResults } = useAppSelector(state => state.navigation);
  const { dids } = useAppSelector(state => state.did);
  
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      dispatch(setSearchResults([]));
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await performSearch(searchQuery);
        dispatch(setSearchResults(results));
      } catch (error) {
        console.error('Search failed:', error);
        dispatch(setSearchResults([]));
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, dispatch]);

  const performSearch = async (query: string): Promise<SearchResult[]> => {
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    // Search DIDs
    const didResults = dids
      .filter(did => 
        did.metadata.name.toLowerCase().includes(lowerQuery) ||
        did.metadata.description.toLowerCase().includes(lowerQuery) ||
        did.metadata.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
        did.id.toLowerCase().includes(lowerQuery)
      )
      .map(did => ({
        id: did.id,
        type: 'did' as const,
        title: did.metadata.name,
        description: did.metadata.description,
        path: `/did/${did.id}`,
        icon: Shield,
        metadata: did,
      }));

    results.push(...didResults);

    // Search datasets (mock data for now)
    const mockDatasets = [
      {
        id: 'dataset-1',
        title: 'Māori Traditional Knowledge Archive',
        description: 'Comprehensive collection of traditional Māori knowledge',
        tags: ['cultural-heritage', 'indigenous', 'māori'],
      },
      {
        id: 'dataset-2',
        title: 'European Medieval Manuscripts',
        description: 'High-resolution digitized medieval manuscripts',
        tags: ['manuscripts', 'medieval', 'european'],
      },
    ];

    const datasetResults = mockDatasets
      .filter(dataset =>
        dataset.title.toLowerCase().includes(lowerQuery) ||
        dataset.description.toLowerCase().includes(lowerQuery) ||
        dataset.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      )
      .map(dataset => ({
        id: dataset.id,
        type: 'dataset' as const,
        title: dataset.title,
        description: dataset.description,
        path: `/datasets/${dataset.id}`,
        icon: Database,
        metadata: dataset,
      }));

    results.push(...datasetResults);

    // Search pages
    const pages = [
      { id: 'did', title: 'DID Manager', description: 'Create and manage decentralized identifiers', icon: Shield },
      { id: 'datasets', title: 'Dataset Explorer', description: 'Discover and explore datasets', icon: Database },
      { id: 'gdpr', title: 'GDPR Compliance', description: 'Manage privacy and consent', icon: FileText },
    ];

    const pageResults = pages
      .filter(page =>
        page.title.toLowerCase().includes(lowerQuery) ||
        page.description.toLowerCase().includes(lowerQuery)
      )
      .map(page => ({
        id: page.id,
        type: 'page' as const,
        title: page.title,
        description: page.description,
        path: `/${page.id}`,
        icon: page.icon,
      }));

    results.push(...pageResults);

    return results.slice(0, 10); // Limit results
  };

  const handleSearch = (query: string) => {
    dispatch(setSearchQuery(query));
  };

  const handleResultClick = (result: SearchResult) => {
    // Add to recent searches
    const newRecentSearches = [result.title, ...recentSearches.filter(s => s !== result.title)].slice(0, 5);
    setRecentSearches(newRecentSearches);
    localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));

    // Navigate to result
    if (result.type === 'page') {
      dispatch(setActiveSection(result.id));
    }
    
    dispatch(closeSearch());
  };

  const handleRecentSearchClick = (search: string) => {
    dispatch(setSearchQuery(search));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const handleClose = () => {
    dispatch(closeSearch());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden"
            onKeyDown={handleKeyDown}
          >
            {/* Search Header */}
            <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <Search className="w-5 h-5 text-gray-400 mr-3" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search DIDs, datasets, or pages..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none text-lg"
                aria-label="Search"
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close search"
              >
                <X className="w-5 h-5 text-gray-400" />
              </motion.button>
            </div>

            {/* Search Content */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Searching...</span>
                </div>
              ) : searchQuery.trim() ? (
                searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((result, index) => {
                      const Icon = result.icon;
                      return (
                        <motion.button
                          key={result.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleResultClick(result)}
                          className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 dark:text-white truncate">
                              {result.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {result.description}
                            </p>
                            <span className="text-xs text-gray-500 dark:text-gray-500 capitalize">
                              {result.type}
                            </span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
                        </motion.button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                    <Search className="w-8 h-8 mb-2" />
                    <p>No results found for "{searchQuery}"</p>
                    <p className="text-sm">Try different keywords or check spelling</p>
                  </div>
                )
              ) : (
                <div className="py-4">
                  {recentSearches.length > 0 && (
                    <div className="px-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Recent Searches</h3>
                        <button
                          onClick={clearRecentSearches}
                          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="space-y-1">
                        {recentSearches.map((search, index) => (
                          <button
                            key={index}
                            onClick={() => handleRecentSearchClick(search)}
                            className="flex items-center space-x-2 w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                          >
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700 dark:text-gray-300">{search}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="px-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Quick Actions</h3>
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          dispatch(setActiveSection('did'));
                          handleClose();
                        }}
                        className="flex items-center space-x-2 w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                      >
                        <Shield className="w-4 h-4 text-primary-500" />
                        <span className="text-gray-700 dark:text-gray-300">Create New DID</span>
                      </button>
                      <button
                        onClick={() => {
                          dispatch(setActiveSection('datasets'));
                          handleClose();
                        }}
                        className="flex items-center space-x-2 w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                      >
                        <Database className="w-4 h-4 text-secondary-500" />
                        <span className="text-gray-700 dark:text-gray-300">Browse Datasets</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchModal;