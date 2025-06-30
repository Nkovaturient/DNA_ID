import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Shield, Trash2, Eye, Copy, CheckCircle, AlertCircle, Clock, Database } from 'lucide-react';
import { useDID } from '../contexts/DIDContext';
import { powergateService } from '../services/powergateService';
import { dataverseAPI } from '../api/dataverseApi';
import { format } from 'date-fns';

const DIDManager: React.FC = () => {
  const { dids, createDID, revokeDID } = useDID();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedDID, setSelectedDID] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    method: 'flow' as 'flow' | 'near',
    name: '',
    description: '',
    type: 'dataset' as 'dataset' | 'researcher' | 'institution',
    tags: '',
    culturalHeritage: false,
    gdprConsent: false,
    purposes: [] as string[],
    // Additional Dataverse metadata fields
    author: '',
    authorAffiliation: '',
    contactEmail: '',
    subject: 'Cultural Heritage' as string,
    keywords: '',
    language: 'en',
    depositor: '',
    alternativeTitle: '',
    file: null as File | null
  });

  const handleCreateDID = async () => {
    try {
      // 1. Upload file to IPFS/Filecoin if provided
      let fileStorageResult = null;
      if (formData.file) {
        const fileBuffer = await formData.file.arrayBuffer();
        // Convert ArrayBuffer to Buffer for browser compatibility
        const buffer = Buffer.from(fileBuffer);
        fileStorageResult = await powergateService.storeData(
          buffer,
          'dataset-file',
          {
            hot: { enabled: true, allowUnfreeze: true },
            cold: {
              enabled: true,
              filecoin: {
                repFactor: 2,
                dealMinDuration: 518400, // ~6 months
                verifiedDeal: true
              }
            }
          }
        );
        console.log('File stored:', fileStorageResult);
      }

      // 2. Create enhanced metadata including Dataverse fields
      const enhancedMetadata = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        culturalHeritage: formData.culturalHeritage,
        // Dataverse metadata fields
        author: formData.author,
        authorAffiliation: formData.authorAffiliation,
        contactEmail: formData.contactEmail,
        subject: formData.subject,
        keywords: formData.keywords.split(',').map(kw => kw.trim()).filter(Boolean),
        language: formData.language,
        depositor: formData.depositor || formData.author,
        alternativeTitle: formData.alternativeTitle,
        fileStorageInfo: fileStorageResult
      };

      // 3. Create DID using integration service
      await createDID({
        method: formData.method,
        metadata: enhancedMetadata,
        gdprConsent: {
          timestamp: new Date(),
          granted: formData.gdprConsent,
          purposes: formData.purposes
        }
      });

      // 4. Optional: Create dataset in Dataverse if this is a dataset DID
      if (formData.type === 'dataset') {
        try {
          const dataverseMetadata = {
            title: formData.name,
            description: formData.description,
            authors: [{
              name: formData.author,
              affiliation: formData.authorAffiliation,
              identifier: '',
              identifierScheme: 'ORCID'
            }],
            contactName: formData.author,
            contactEmail: formData.contactEmail,
            subjects: [formData.subject],
            keywords: formData.keywords.split(',').map(kw => ({
              value: kw.trim(),
              vocabulary: '',
              vocabularyURI: ''
            })).filter(k => k.value),
            culturalHeritage: formData.culturalHeritage,
            depositor: formData.depositor || formData.author
          };

          const files = formData.file ? [{
            name: formData.file.name,
            file: formData.file,
            description: `Dataset file for ${formData.name}`,
            mimeType: formData.file.type
          }] : undefined;

          // Fix: Ensure dataverseMetadata matches DatasetMetadata type (must have 'subject' and 'author' fields)
          const dataverseDataset = await dataverseAPI.createDataset(
            'root',
            {
              ...dataverseMetadata,
              subject: [formData.subject], // ensure 'subject' field exists as array
              author: [{
                authorName: formData.author,
                authorAffiliation: formData.authorAffiliation,
                authorIdentifier: '',
                authorIdentifierScheme: 'ORCID'
              }] // ensure 'author' field exists as array
            },
            files
          );

          console.log('Dataset created in Dataverse:', dataverseDataset);
        } catch (error) {
          console.warn('Failed to create dataset in Dataverse:', error);
          // Don't fail the entire process if Dataverse creation fails
        }
      }
    } catch (error) {
      console.error('DID creation failed:', error);
      alert('Failed to create DID. Please try again.');
      return;
    }

    setShowCreateForm(false);
    setFormData({
      method: 'flow',
      name: '',
      description: '',
      type: 'dataset',
      tags: '',
      culturalHeritage: false,
      gdprConsent: false,
      purposes: [],
      // Reset Dataverse metadata fields
      author: '',
      authorAffiliation: '',
      contactEmail: '',
      subject: 'Cultural Heritage',
      keywords: '',
      language: 'en',
      depositor: '',
      alternativeTitle: '',
      file: null
    });
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
              DID Manager
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Create and manage your decentralized identifiers
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold hover:shadow-xl transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            <span>Create DID</span>
          </motion.button>
        </div>

        <div className="grid gap-6 mb-8">
          {dids.map((did) => (
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {did.metadata.type} • {did.method.toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
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
                      onClick={() => revokeDID(did.id)}
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
              </div>

              <AnimatePresence>
                {selectedDID === did.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4"
                  >
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Identity Details</h4>
                        <div className="space-y-1">
                          <p><span className="text-gray-500">DID:</span> {did.id}</p>
                          <p><span className="text-gray-500">Subject:</span> {did.subject}</p>
                          <p><span className="text-gray-500">Created:</span> {format(did.created, 'PPp')}</p>
                          <p><span className="text-gray-500">Status:</span> {did.status}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Storage</h4>
                        <div className="space-y-1">
                          <p><span className="text-gray-500">IPFS:</span> {did.storage.ipfsHash}</p>
                          {did.storage.filecoinDeal && (
                            <p><span className="text-gray-500">Filecoin:</span> {did.storage.filecoinDeal}</p>
                          )}
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">GDPR Compliance</h4>
                        <div className="space-y-1">
                          <p><span className="text-gray-500">Consent:</span> {did.gdprConsent.granted ? 'Granted' : 'Not granted'}</p>
                          <p><span className="text-gray-500">Timestamp:</span> {format(did.gdprConsent.timestamp, 'PPp')}</p>
                          <p><span className="text-gray-500">Purposes:</span> {did.gdprConsent.purposes.join(', ')}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

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
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Create New DID
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Blockchain Method
                    </label>
                    <select
                      value={formData.method}
                      onChange={(e) => setFormData(prev => ({ ...prev, method: e.target.value as 'flow' | 'near' }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="flow">Flow</option>
                      <option value="near">NEAR</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter DID name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="dataset">Dataset</option>
                      <option value="researcher">Researcher</option>
                      <option value="institution">Institution</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., research, data, cultural-heritage"
                    />
                  </div>

                  {/* Additional Dataverse Metadata Fields */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                      <Database className="w-5 h-5 mr-2" />
                      Dataverse Metadata
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Author *
                        </label>
                        <input
                          type="text"
                          value={formData.author}
                          onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Dataset author name"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Author Affiliation
                        </label>
                        <input
                          type="text"
                          value={formData.authorAffiliation}
                          onChange={(e) => setFormData(prev => ({ ...prev, authorAffiliation: e.target.value }))}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Institution or organization"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Subject
                        </label>
                        <select
                          value={formData.subject}
                          onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="Cultural Heritage">Cultural Heritage</option>
                          <option value="Arts and Humanities">Arts and Humanities</option>
                          <option value="Social Sciences">Social Sciences</option>
                          <option value="Computer and Information Science">Computer and Information Science</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                          Language
                        </label>
                        <select
                          value={formData.language}
                          onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                          <option value="it">Italian</option>
                          <option value="pt">Portuguese</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Alternative Title
                      </label>
                      <input
                        type="text"
                        value={formData.alternativeTitle}
                        onChange={(e) => setFormData(prev => ({ ...prev, alternativeTitle: e.target.value }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Alternative or translated title"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Dataset File
                      </label>
                      <input
                        type="file"
                        onChange={(e) => setFormData(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                        accept=".csv,.json,.xml,.txt,.pdf,.zip"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Supported formats: CSV, JSON, XML, TXT, PDF, ZIP
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="culturalHeritage"
                      checked={formData.culturalHeritage}
                      onChange={(e) => setFormData(prev => ({ ...prev, culturalHeritage: e.target.checked }))}
                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="culturalHeritage" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Cultural Heritage Dataset
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="gdprConsent"
                      checked={formData.gdprConsent}
                      onChange={(e) => setFormData(prev => ({ ...prev, gdprConsent: e.target.checked }))}
                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="gdprConsent" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Grant GDPR Consent
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-4 mt-6">
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
                    disabled={!formData.name}
                    className="px-6 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create DID
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

export default DIDManager;