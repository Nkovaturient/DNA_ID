import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { motion } from 'framer-motion';
import { store, useAppDispatch, useAppSelector } from './store';
import { ThemeProvider } from './contexts/ThemeContext';
import { DIDProvider } from './contexts/DIDContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingSpinner from './components/common/LoadingSpinner';
import NavigationBar from './components/navigation/NavigationBar';
import Breadcrumbs from './components/navigation/Breadcrumbs';

// Page Components
import Hero from './components/Hero';
import DIDManager from './components/DIDManager';
import DatasetExplorer from './components/DatasetExplorer';
import GDPRConsent from './components/GDPRConsent';
import SystemFlow from './components/SystemFlow';
import BioAgentsIntegration from './components/BioAgentsIntegration';
import DataverseIntegration from './components/DataverseIntegration';
import Footer from './components/Footer';

// Integration initialization
import { 
  initializeFlow, 
  initializeNear, 
  initializePowergate, 
  initializeVeramo 
} from './store/slices/integrationSlice';

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { activeSection } = useAppSelector(state => state.navigation);
  const { isLoading } = useAppSelector(state => state.auth);

  // Initialize integrations on app start
  useEffect(() => {
    const initializeIntegrations = async () => {
      try {
        // Initialize blockchain connections
        await dispatch(initializeFlow({}));
        await dispatch(initializeNear({}));
        
        // Initialize storage and VC systems
        await dispatch(initializePowergate({}));
        await dispatch(initializeVeramo());
        
        console.log('All integrations initialized successfully');
      } catch (error) {
        console.error('Integration initialization failed:', error);
      }
    };

    initializeIntegrations();
  }, [dispatch]);

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'did':
        return <DIDManager />;
      case 'datasets':
        return <DatasetExplorer />;
      case 'gdpr':
        return <GDPRConsent />;
      case 'system-flow':
        return <SystemFlow />;
      case 'bioagents':
        return <BioAgentsIntegration />;
      case 'dataverse':
        return <DataverseIntegration />;
      default:
        return <Hero onNavigate={(section) => dispatch({ type: 'navigation/setActiveSection', payload: section })} />;
    }
  };

  if (isLoading) {
    return (
      <LoadingSpinner 
        size="xl" 
        text="Initializing DID Infrastructure..." 
        fullScreen 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 transition-colors duration-300">
      <NavigationBar />
      
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumbs />
          {renderActiveSection()}
        </div>
      </motion.main>

      <Footer />
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <ThemeProvider>
          <DIDProvider>
            <AppContent />
          </DIDProvider>
        </ThemeProvider>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;