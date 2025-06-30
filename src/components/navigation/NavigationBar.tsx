import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  Moon, 
  Sun, 
  Shield, 
  Database, 
  FileText, 
  Cpu, 
  Network, 
  Zap,
  Search,
  Menu,
  X,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Bell,
  Wallet
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  setActiveSection, 
  toggleSearch, 
  toggleMobileMenu, 
  closeMobileMenu 
} from '../../store/slices/navigationSlice';
import { 
  authenticateWithFlow, 
  authenticateWithNear, 
  logout 
} from '../../store/slices/authSlice';
import SearchModal from './SearchModal';
import UserDropdown from './UserDropdown';
import { NavigationItem } from '../../types';

const NavigationBar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isDark, toggleTheme } = useTheme();
  const { activeSection, isMobileMenuOpen } = useAppSelector(state => state.navigation);
  const { user, isAuthenticated, isLoading } = useAppSelector(state => state.auth);
  const { flow, near } = useAppSelector(state => state.integration);
  
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);

  const navItems: NavigationItem[] = [
    { id: 'home', label: 'Home', path: '/', icon: Globe },
    { id: 'did', label: 'DID Manager', path: '/did', icon: Shield, requiresAuth: true },
    { id: 'datasets', label: 'Datasets', path: '/datasets', icon: Database },
    { id: 'gdpr', label: 'GDPR', path: '/gdpr', icon: FileText },
    // { id: 'system-flow', label: 'System Flow', path: '/system-flow', icon: Network },
    { id: 'bioagents', label: 'BioAgents', path: '/bioagents', icon: Cpu },
    { id: 'dataverse', label: 'Dataverse', path: '/dataverse', icon: Zap }
  ];

  const handleNavigation = (sectionId: string) => {
    dispatch(setActiveSection(sectionId));
    dispatch(closeMobileMenu());
  };

  const handleAuthentication = async (network: 'flow' | 'near') => {
    if (network === 'flow') {
      dispatch(authenticateWithFlow());
    } else {
      dispatch(authenticateWithNear());
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    setShowUserDropdown(false);
  };

  const getNetworkStatus = () => {
    if (flow.isConnected) return { name: 'Flow', status: 'connected', color: 'bg-green-500' };
    if (near.isConnected) return { name: 'NEAR', status: 'connected', color: 'bg-blue-500' };
    return { name: 'Disconnected', status: 'disconnected', color: 'bg-gray-500' };
  };

  const networkStatus = getNetworkStatus();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setShowUserDropdown(false);
        setShowNetworkDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => handleNavigation('home')}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block mr-4 p-2">
                DNA_ID
              </span>
            </motion.div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                const canAccess = !item.requiresAuth || isAuthenticated;
                
                return (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => canAccess && handleNavigation(item.id)}
                    disabled={!canAccess}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                      isActive
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                        : canAccess
                        ? 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                        : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    }`}
                    aria-label={item.label}
                    role="menuitem"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.label}</span>
                    {item.requiresAuth && !isAuthenticated && (
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    )}
                  </motion.button>
                );
              })}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Search Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => dispatch(toggleSearch())}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </motion.button>

              {/* Network Status */}
              <div className="dropdown-container relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Network status"
                >
                  <div className={`w-2 h-2 rounded-full ${networkStatus.color}`} />
                  <span className="text-sm font-medium hidden sm:block">{networkStatus.name}</span>
                  <ChevronDown className="w-4 h-4" />
                </motion.button>

                <AnimatePresence>
                  {showNetworkDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2"
                    >
                      <button
                        onClick={() => handleAuthentication('flow')}
                        disabled={isLoading}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                      >
                        <div className={`w-2 h-2 rounded-full ${flow.isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span>Flow {flow.isConnected ? '(Connected)' : '(Connect)'}</span>
                      </button>
                      <button
                        onClick={() => handleAuthentication('near')}
                        disabled={isLoading}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                      >
                        <div className={`w-2 h-2 rounded-full ${near.isConnected ? 'bg-blue-500' : 'bg-gray-400'}`} />
                        <span>NEAR {near.isConnected ? '(Connected)' : '(Connect)'}</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Authentication */}
              {isAuthenticated && user ? (
                <div className="dropdown-container relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:shadow-lg transition-all duration-300"
                    aria-label="User menu"
                  >
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium hidden sm:block">
                      {user.profile?.name || user.address.slice(0, 8)}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </motion.button>

                  <UserDropdown 
                    isOpen={showUserDropdown}
                    onClose={() => setShowUserDropdown(false)}
                    user={user}
                    onLogout={handleLogout}
                  />
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAuthentication('flow')}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                  >
                    <Wallet className="w-4 h-4" />
                    <span className="hidden sm:block">Connect Wallet</span>
                  </motion.button>
                </div>
              )}

              {/* Theme Toggle */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.button>

              {/* Mobile Menu Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => dispatch(toggleMobileMenu())}
                className="lg:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700"
            >
              <nav className="px-4 py-4 space-y-2" role="menu">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  const canAccess = !item.requiresAuth || isAuthenticated;
                  
                  return (
                    <motion.button
                      key={item.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => canAccess && handleNavigation(item.id)}
                      disabled={!canAccess}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                          : canAccess
                          ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                          : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      }`}
                      role="menuitem"
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                      {item.requiresAuth && !isAuthenticated && (
                        <div className="w-2 h-2 rounded-full bg-yellow-500 ml-auto" />
                      )}
                    </motion.button>
                  );
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <SearchModal />
    </>
  );
};

export default NavigationBar;