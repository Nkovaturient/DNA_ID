import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Home } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store';
import { setActiveSection } from '../../store/slices/navigationSlice';
import { BreadcrumbItem } from '../../types';

const Breadcrumbs: React.FC = () => {
  const dispatch = useAppDispatch();
  const { breadcrumbs, activeSection } = useAppSelector(state => state.navigation);

  const handleNavigate = (path?: string, sectionId?: string) => {
    if (sectionId) {
      dispatch(setActiveSection(sectionId));
    }
  };

  // Generate breadcrumbs based on active section
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const baseBreadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', path: '/' }
    ];

    switch (activeSection) {
      case 'did':
        return [...baseBreadcrumbs, { label: 'DID Manager', isActive: true }];
      case 'datasets':
        return [...baseBreadcrumbs, { label: 'Dataset Explorer', isActive: true }];
      case 'gdpr':
        return [...baseBreadcrumbs, { label: 'GDPR Compliance', isActive: true }];
      case 'system-flow':
        return [...baseBreadcrumbs, { label: 'System Flow', isActive: true }];
      case 'bioagents':
        return [...baseBreadcrumbs, { label: 'BioAgents Integration', isActive: true }];
      case 'dataverse':
        return [...baseBreadcrumbs, { label: 'Dataverse Integration', isActive: true }];
      default:
        return baseBreadcrumbs;
    }
  };

  const currentBreadcrumbs = breadcrumbs.length > 0 ? breadcrumbs : generateBreadcrumbs();

  if (currentBreadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav 
      className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6"
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-2">
        {currentBreadcrumbs.map((item, index) => (
          <li key={index} className="flex items-center space-x-2">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
            )}
            
            {item.isActive ? (
              <span 
                className="font-medium text-gray-900 dark:text-white"
                aria-current="page"
              >
                {index === 0 && <Home className="w-4 h-4 inline mr-1" />}
                {item.label}
              </span>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleNavigate(item.path, index === 0 ? 'home' : undefined)}
                className="flex items-center hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {index === 0 && <Home className="w-4 h-4 mr-1" />}
                {item.label}
              </motion.button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;