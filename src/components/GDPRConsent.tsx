import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, XCircle, Download, Trash2, Eye, FileText, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';

interface ConsentRecord {
  id: string;
  purpose: string;
  granted: boolean;
  timestamp: Date;
  dataTypes: string[];
  retentionPeriod: string;
  thirdParties: string[];
}

const GDPRConsent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'consent' | 'rights' | 'data'>('consent');
  const [consentRecords] = useState<ConsentRecord[]>([
    {
      id: '1',
      purpose: 'Research and Academic Study',
      granted: true,
      timestamp: new Date('2024-01-15T10:30:00'),
      dataTypes: ['Identity data', 'Research preferences', 'Usage analytics'],
      retentionPeriod: '5 years',
      thirdParties: ['University partners', 'Research consortiums']
    },
    {
      id: '2',
      purpose: 'Cultural Heritage Preservation',
      granted: true,
      timestamp: new Date('2024-01-15T10:32:00'),
      dataTypes: ['Cultural metadata', 'Contribution history', 'Community interactions'],
      retentionPeriod: 'Indefinite (with consent)',
      thirdParties: ['Museums', 'Cultural institutions', 'Educational platforms']
    },
    {
      id: '3',
      purpose: 'Marketing and Communications',
      granted: false,
      timestamp: new Date('2024-01-15T10:35:00'),
      dataTypes: ['Contact information', 'Communication preferences'],
      retentionPeriod: '2 years',
      thirdParties: ['Email service providers']
    }
  ]);

  const tabs = [
    { id: 'consent', label: 'Consent Management', icon: Shield },
    { id: 'rights', label: 'Data Rights', icon: FileText },
    { id: 'data', label: 'Data Export', icon: Download }
  ];

  const dataRights = [
    {
      title: 'Right to Access',
      description: 'View all personal data we have about you',
      action: 'Request Access',
      icon: Eye
    },
    {
      title: 'Right to Rectification',
      description: 'Correct inaccurate or incomplete data',
      action: 'Update Data',
      icon: FileText
    },
    {
      title: 'Right to Erasure',
      description: 'Request deletion of your personal data',
      action: 'Delete Data',
      icon: Trash2
    },
    {
      title: 'Right to Portability',
      description: 'Export your data in a machine-readable format',
      action: 'Export Data',
      icon: Download
    }
  ];

  const handleConsentToggle = (recordId: string) => {
    console.log('Toggle consent for record:', recordId);
  };

  const handleDataExport = (format: string) => {
    console.log('Export data in format:', format);
  };

  const handleRightRequest = (right: string) => {
    console.log('Request right:', right);
  };

  return (
    <div className="min-h-screen pt-8 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            GDPR Compliance Center [Refining...Coming Soon 🚧]
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your data privacy, consent, and rights in compliance with GDPR
          </p>
        </div>

        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`group inline-flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {activeTab === 'consent' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Your Consent Preferences
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Manage how your data is used for different purposes. You can withdraw consent at any time.
              </p>

              <div className="space-y-4">
                {consentRecords.map((record) => (
                  <div
                    key={record.id}
                    className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {record.granted ? (
                          <CheckCircle className="w-6 h-6 text-secondary-500" />
                        ) : (
                          <XCircle className="w-6 h-6 text-red-500" />
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {record.purpose}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {record.granted ? 'Consent granted' : 'Consent withdrawn'} on{' '}
                            {format(record.timestamp, 'PPp')}
                          </p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleConsentToggle(record.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          record.granted
                            ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800'
                            : 'bg-secondary-100 dark:bg-secondary-900 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-200 dark:hover:bg-secondary-800'
                        }`}
                      >
                        {record.granted ? 'Withdraw' : 'Grant'}
                      </motion.button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center space-x-1">
                          <FileText className="w-4 h-4" />
                          <span>Data Types</span>
                        </h4>
                        <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                          {record.dataTypes.map((type, index) => (
                            <li key={index}>• {type}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>Retention</span>
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300">{record.retentionPeriod}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>Third Parties</span>
                        </h4>
                        <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                          {record.thirdParties.map((party, index) => (
                            <li key={index}>• {party}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'rights' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Your Data Rights
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Under GDPR, you have several rights regarding your personal data. Exercise them here.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                {dataRights.map((right, index) => {
                  const Icon = right.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-start space-x-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {right.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                            {right.description}
                          </p>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleRightRequest(right.title)}
                            className="px-4 py-2 rounded-lg bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-800 font-medium text-sm transition-colors"
                          >
                            {right.action}
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'data' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Data Export & Portability
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Export your data in various formats for backup or transfer to other services.
              </p>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {['JSON', 'CSV', 'XML'].map((format) => (
                  <motion.button
                    key={format}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDataExport(format)}
                    className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 group"
                  >
                    <Download className="w-8 h-8 text-primary-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Export as {format}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Download your data in {format} format
                    </p>
                  </motion.button>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  What's included in your export?
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• DID records and metadata</li>
                  <li>• Consent history and preferences</li>
                  <li>• Dataset contributions and interactions</li>
                  <li>• Account settings and preferences</li>
                  <li>• Activity logs (anonymized)</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default GDPRConsent;