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
  createDID: (data: Partial<DID>) => Promise<DID>;
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

  const createDID = async (data: Partial<DID>): Promise<DID> => {
    const newDID: DID = {
      id: `did:${data.method || 'flow'}:mainnet:0x${Math.random().toString(16).substr(2, 16)}`,
      method: data.method || 'flow',
      subject: `0x${Math.random().toString(16).substr(2, 16)}`,
      created: new Date(),
      status: 'active',
      metadata: {
        name: data.metadata?.name || 'Unnamed Dataset',
        description: data.metadata?.description || '',
        type: data.metadata?.type || 'dataset',
        tags: data.metadata?.tags || [],
        culturalHeritage: data.metadata?.culturalHeritage
      },
      storage: {
        ipfsHash: `Qm${Math.random().toString(36).substr(2, 44)}`,
        filecoinDeal: `bafk2${Math.random().toString(36).substr(2, 50)}`
      },
      gdprConsent: {
        granted: data.gdprConsent?.granted || false,
        timestamp: new Date(),
        purposes: data.gdprConsent?.purposes || []
      }
    };

    setDids(prev => [...prev, newDID]);
    return newDID;
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