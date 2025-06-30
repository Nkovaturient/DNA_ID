// Core Types
export interface User {
  id: string;
  address: string;
  network: 'flow' | 'near';
  profile?: {
    name?: string;
    avatar?: string;
    email?: string;
  };
  permissions: string[];
  createdAt: Date;
}

export interface DID {
  id: string;
  method: 'flow' | 'near';
  subject: string;
  created: Date;
  status: 'active' | 'revoked' | 'suspended';
  metadata: {
    name: string;
    description: string;
    type: 'dataset' | 'researcher' | 'institution';
    tags: string[];
    culturalHeritage?: boolean;
  };
  storage: {
    ipfsHash: string;
    filecoinDeal?: string;
    powergateToken?: string;
  };
  gdprConsent: {
    granted: boolean;
    timestamp: Date;
    purposes: string[];
  };
  verifiableCredentials?: VerifiableCredential[];
}

export interface VerifiableCredential {
  id: string;
  type: string[];
  issuer: string;
  issuanceDate: string;
  credentialSubject: Record<string, any>;
  proof: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    jws: string;
  };
}

export interface Dataset {
  id: string;
  doi?: string;
  handle?: string;
  title: string;
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
  metadata: Record<string, any>;
}

// Dataverse Dataset Metadata Types
export interface DatasetMetadata {
  title: string;
  subtitle?: string;
  description: string;
  subject: string[];
  keyword?: string[];
  publication?: {
    publicationCitation?: string;
    publicationIDType?: string;
    publicationIDNumber?: string;
    publicationURL?: string;
  };
  producer?: {
    producerName?: string;
    producerAffiliation?: string;
    producerAbbreviation?: string;
    producerURL?: string;
  };
  author: {
    authorName: string;
    authorAffiliation?: string;
    authorIdentifierScheme?: string;
    authorIdentifier?: string;
  }[];
  datasetContact?: {
    datasetContactName?: string;
    datasetContactAffiliation?: string;
    datasetContactEmail?: string;
  }[];
  distributionDate?: string;
  depositor?: string;
  dateOfDeposit?: string;
  timePeriodCovered?: {
    timePeriodCoveredStart?: string;
    timePeriodCoveredEnd?: string;
  };
  dateOfCollection?: {
    dateOfCollectionStart?: string;
    dateOfCollectionEnd?: string;
  };
  kindOfData?: string[];
  language?: string[];
  grantInformation?: {
    grantAgency?: string;
    grantNumber?: string;
  }[];
  // Custom HeliXID fields
  culturalHeritage?: boolean;
  gdprCompliant?: boolean;
  didId?: string;
  ipfsHash?: string;
  filecoinDeal?: string;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
}

// Navigation Types
export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<any>;
  children?: NavigationItem[];
  requiresAuth?: boolean;
  permissions?: string[];
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
  isActive?: boolean;
}

// Integration Types
export interface FlowConfig {
  accessNode: string;
  walletDiscovery: string;
  contractAddress: string;
  network: 'testnet' | 'mainnet';
}

export interface NearConfig {
  networkId: 'testnet' | 'mainnet';
  nodeUrl: string;
  walletUrl: string;
  contractId: string;
}

export interface PowergateConfig {
  host: string;
  token?: string;
  debug?: boolean;
}

export interface DataverseConfig {
  baseUrl: string;
  apiKey?: string;
  timeout: number;
}

// State Types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  network: 'flow' | 'near' | null;
}

export interface NavigationState {
  activeSection: string;
  breadcrumbs: BreadcrumbItem[];
  searchQuery: string;
  searchResults: any[];
  isSearchOpen: boolean;
  isMobileMenuOpen: boolean;
}

export interface IntegrationState {
  flow: {
    isConnected: boolean;
    address: string | null;
    config: FlowConfig;
  };
  near: {
    isConnected: boolean;
    accountId: string | null;
    config: NearConfig;
  };
  powergate: {
    isConnected: boolean;
    config: PowergateConfig;
  };
  dataverse: {
    isConnected: boolean;
    config: DataverseConfig;
  };
  veramo: {
    isInitialized: boolean;
  };
}

export interface DIDState {
  dids: DID[];
  selectedDID: DID | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    type: string;
    status: string;
    culturalHeritage: boolean;
  };
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  status?: Number;
  details?: any;
  timestamp: Date;
}