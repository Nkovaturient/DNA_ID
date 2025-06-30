import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Settings, 
  LogOut, 
  Shield, 
  Database, 
  FileText, 
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { User as UserType } from '../../types';
import { useState } from 'react';

interface UserDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType;
  onLogout: () => void;
}

const UserDropdown: React.FC<UserDropdownProps> = ({ isOpen, onClose, user, onLogout }) => {
  const [copiedAddress, setCopiedAddress] = useState(false);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(user.address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const getExplorerUrl = () => {
    if (user.network === 'flow') {
      return `https://flowscan.org/account/${user.address}`;
    } else if (user.network === 'near') {
      return `https://explorer.testnet.near.org/accounts/${user.address}`;
    }
    return '#';
  };

  const menuItems = [
    {
      icon: User,
      label: 'Profile',
      action: () => console.log('Profile clicked'),
      description: 'Manage your profile settings'
    },
    {
      icon: Shield,
      label: 'My DIDs',
      action: () => console.log('DIDs clicked'),
      description: 'View your decentralized identifiers'
    },
    {
      icon: Database,
      label: 'My Datasets',
      action: () => console.log('Datasets clicked'),
      description: 'Manage your datasets'
    },
    {
      icon: FileText,
      label: 'Privacy Settings',
      action: () => console.log('Privacy clicked'),
      description: 'GDPR compliance and consent'
    },
    {
      icon: Settings,
      label: 'Settings',
      action: () => console.log('Settings clicked'),
      description: 'Application preferences'
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50"
        >
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {user.profile?.name || 'Anonymous User'}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-mono truncate">
                    {user.address.slice(0, 12)}...{user.address.slice(-4)}
                  </span>
                  <button
                    onClick={copyAddress}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Copy address"
                  >
                    {copiedAddress ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Network Badge */}
            <div className="mt-2 flex items-center justify-between">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                user.network === 'flow' 
                  ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                  : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
              }`}>
                {user.network?.toUpperCase()} Network
              </span>
              <a
                href={getExplorerUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
              >
                <span>View on Explorer</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={index}
                  whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {item.label}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {item.description}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Logout */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
            <motion.button
              whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-red-600 dark:text-red-400">
                  Sign Out
                </p>
                <p className="text-sm text-red-500 dark:text-red-500">
                  Disconnect from {user.network?.toUpperCase()} network
                </p>
              </div>
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UserDropdown;