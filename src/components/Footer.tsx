import React from 'react';
import { Globe, Github, Twitter, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                DNA_ID
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-md">
              Next-generation decentralized identity infrastructure with W3C DID standards, 
              GDPR compliance, and AI-powered metadata management.
            </p>
            <div className="flex items-center space-x-4">
              <a
                href="https://github.com/Nkovaturient/DNA_ID"
                className="text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://x.com/matriX_Nk"
                className="text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href=""
                className="text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Platform
            </h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li><a href="#" className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors">DID Manager</a></li>
              <li><a href="#" className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors">Dataset Explorer</a></li>
              <li><a href="#" className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors">GDPR Compliance</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Resources
            </h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li><a href="#" className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors">W3C DID Spec</a></li>
              <li><a href="#" className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors">GDPR Guidelines</a></li>
              <li><a href="#" className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors">Cultural Heritage</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8 text-center text-gray-600 dark:text-gray-300">
          <p>&copy; 2025 DNA + AI + ID. Built for the future of Decentralized Resources Identity.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;