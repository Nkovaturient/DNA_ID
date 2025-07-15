export interface Dataset {
    persistentId: any;
    metadataBlocks: any;
    publicationDate: any;
    createTime: any;
    modificationTime: any;
    versionState: any;
    versionNumber: any;
    minorVersionNumber: any;
    id: string;
    doi?: string;
    handle?: string;
    title: string;
    description: string;
    author: string;
    keywords: String[]
    language: string[];
    version: string;
    storageIdentifier: string;
    email: string;
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

  export interface AppError {
    code: string;
    message: string;
    status?: Number;
    details?: any;
    timestamp: Date;
  }