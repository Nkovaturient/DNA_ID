import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  };
  gdprConsent: {
    granted: boolean;
    timestamp: Date;
    purposes: string[];
  };
}

interface DIDContextType {
  dids: DID[];
  createDID: (data: Partial<DID> & { file?: any }) => Promise<DID>;
  updateDID: (id: string, updates: Partial<DID>) => void;
  revokeDID: (id: string) => void;
  getDID: (id: string) => DID | undefined;
}

const DIDContext = createContext<DIDContextType | undefined>(undefined);

export const useDID = () => {
  const context = useContext(DIDContext);
  if (!context) {
    throw new Error('useDID must be used within a DIDProvider');
  }
  return context;
};

export const DIDProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dids, setDids] = useState<DID[]>([
    {
      id: 'did:flow:mainnet:0x1234567890abcdef',
      method: 'flow',
      subject: '0x1234567890abcdef',
      created: new Date('2024-01-15'),
      status: 'active',
      metadata: {
        name: 'Indigenous Art Collection',
        description: 'Traditional artworks from Pacific Northwest indigenous communities',
        type: 'dataset',
        tags: ['cultural-heritage', 'indigenous', 'art', 'traditional'],
        culturalHeritage: true
      },
      storage: {
        ipfsHash: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
        filecoinDeal: 'bafk2bzacecnvkhym2npvn4v6o2zskhhyv3k2ik3qxgxl5u4qrhlqypmhxgfgm'
      },
      gdprConsent: {
        granted: true,
        timestamp: new Date('2024-01-15'),
        purposes: ['research', 'preservation', 'education']
      }
    }
  ]);

  const createDID = async (data: Partial<DID> & { file?: any }): Promise<DID> => {
    try {
      // Call the backend API for DID creation
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

      // Create FormData for multipart upload
      const formData = new FormData();
      
      // Add metadata and GDPR consent as JSON strings
      formData.append('method', data.method || 'flow');
      formData.append('metadata', JSON.stringify(data.metadata));
      formData.append('gdprConsent', JSON.stringify(data.gdprConsent));
      
      // Add file if provided
      if (data.file) {
        // If file is already a File object, use it directly
        if (data.file instanceof File) {
          formData.append('file', data.file);
        } else if (data.file.data) {
          // If file is base64 data, convert back to File object
          const base64Data = data.file.data;
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const file = new File([bytes], data.file.name, { type: data.file.type });
          formData.append('file', file);
        }
      }

      const response = await fetch(`${BACKEND_URL}/api/did/create`, {
        method: 'POST',
        body: formData 
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'DID creation failed');
      }

      const result = await response.json();
      const backendDID = result.data;

      // Transform backend response to match our DID interface
      const newDID: DID = {
        id: backendDID.id,
        method: backendDID.method,
        subject: backendDID.subject,
        created: new Date(backendDID.created),
        status: backendDID.status,
        metadata: backendDID.metadata,
        storage: {
          ipfsHash: backendDID.storage.ipfsHash,
          filecoinDeal: backendDID.storage.filecoinDeal
        },
        gdprConsent: {
          granted: backendDID.gdprConsent.granted,
          timestamp: new Date(backendDID.gdprConsent.timestamp),
          purposes: backendDID.gdprConsent.purposes
        }
      };

      setDids(prev => [...prev, newDID]);
      return newDID;
    } catch (error: any) {
      console.error('DID creation failed:', error);
      throw error;
    }
  };

  const updateDID = (id: string, updates: Partial<DID>) => {
    setDids(prev => prev.map(did =>
      did.id === id ? { ...did, ...updates } : did
    ));
  };

  const revokeDID = (id: string) => {
    setDids(prev => prev.map(did =>
      did.id === id ? { ...did, status: 'revoked' as const } : did
    ));
  };

  const getDID = (id: string) => dids.find(did => did.id === id);

  return (
    <DIDContext.Provider value={{ dids, createDID, updateDID, revokeDID, getDID }}>
      {children}
    </DIDContext.Provider>
  );
};