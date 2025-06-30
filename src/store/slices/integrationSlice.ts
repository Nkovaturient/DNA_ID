import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { IntegrationState, FlowConfig, NearConfig, PowergateConfig, DataverseConfig } from '../../types';
import * as fcl from '@onflow/fcl';
import { connect, keyStores } from 'near-api-js';
import { Powergate } from '@textile/powergate-client';
import { Agent } from '@veramo/core';
import { CredentialPlugin } from '@veramo/credential-w3c';
import { DIDResolverPlugin } from '@veramo/did-resolver';

const initialState: IntegrationState = {
  flow: {
    isConnected: false,
    address: null,
    config: {
      accessNode: 'https://rest-testnet.onflow.org',
      walletDiscovery: 'https://fcl-discovery.onflow.org/testnet/authn',
      contractAddress: '0x1234567890abcdef',
      network: 'testnet',
    },
  },
  near: {
    isConnected: false,
    accountId: null,
    config: {
      networkId: 'testnet',
      nodeUrl: 'https://rpc.testnet.near.org',
      walletUrl: 'https://wallet.testnet.near.org',
      contractId: 'did-registry.testnet',
    },
  },
  powergate: {
    isConnected: false,
    config: {
      host: 'http://localhost:6002',
      debug: true,
    },
  },
  dataverse: {
    isConnected: false,
    config: {
      baseUrl: 'https://demo.dataverse.org',
      timeout: 30000,
    },
  },
  veramo: {
    isInitialized: false,
  },
};

// Store non-serializable objects outside Redux
let flowAccount: any = null;
let nearAccount: any = null;
let powergateClient: any = null;
let veramoAgent: any = null;

// Getters for non-serializable objects
export const getFlowAccount = () => flowAccount;
export const getNearAccount = () => nearAccount;
export const getPowergateClient = () => powergateClient;
export const getVeramoAgent = () => veramoAgent;

// Flow Integration
export const initializeFlow = createAsyncThunk(
  'integration/initializeFlow',
  async (config: Partial<FlowConfig>, { rejectWithValue }) => {
    try {
      const flowConfig = { ...initialState.flow.config, ...config };
      
      fcl.config()
        .put('accessNode.api', flowConfig.accessNode)
        .put('challenge.handshake', flowConfig.walletDiscovery)
        .put('discovery.wallet', flowConfig.walletDiscovery);

      const account = await fcl.currentUser.snapshot();
      flowAccount = account; // Store outside Redux
      
      return { 
        config: flowConfig, 
        address: account?.addr || null,
        isConnected: !!account?.loggedIn 
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Flow initialization failed');
    }
  }
);

// NEAR Integration
export const initializeNear = createAsyncThunk(
  'integration/initializeNear',
  async (config: Partial<NearConfig>, { rejectWithValue }) => {
    try {
      const nearConfig = { ...initialState.near.config, ...config };
      
      const near = await connect({
        networkId: nearConfig.networkId,
        keyStore: new keyStores.BrowserLocalStorageKeyStore(),
        nodeUrl: nearConfig.nodeUrl,
        walletUrl: nearConfig.walletUrl,
        helperUrl: `https://helper.${nearConfig.networkId}.near.org`,
        explorerUrl: `https://explorer.${nearConfig.networkId}.near.org`,
      });

      const account = await near.account('');
      nearAccount = account; // Store outside Redux
      
      return { 
        config: nearConfig, 
        accountId: account?.accountId || null,
        isConnected: true 
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'NEAR initialization failed');
    }
  }
);

// Powergate Integration
export const initializePowergate = createAsyncThunk(
  'integration/initializePowergate',
  async (config: Partial<PowergateConfig>, { rejectWithValue }) => {
    try {
      const powergateConfig = { ...initialState.powergate.config, ...config };
      
      const client = Powergate({
        host: powergateConfig.host,
        debug: powergateConfig.debug,
      });

      // Test connection
      await client.health.check();
      powergateClient = client; // Store outside Redux
      
      return { config: powergateConfig, isConnected: true };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Powergate initialization failed');
    }
  }
);

// Dataverse Integration
export const initializeDataverse = createAsyncThunk(
  'integration/initializeDataverse',
  async (config: Partial<DataverseConfig>, { rejectWithValue }) => {
    try {
      const dataverseConfig = { ...initialState.dataverse.config, ...config };
      
      // Test connection or initialize client here if needed
      
      return { config: dataverseConfig, isConnected: true };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Dataverse initialization failed');
    }
  }
);

// Veramo Integration
export const initializeVeramo = createAsyncThunk(
  'integration/initializeVeramo',
  async (_, { rejectWithValue }) => {
    try {
      const agent = new Agent({
        plugins: [
          new CredentialPlugin(),
          new DIDResolverPlugin({
            resolver: {
              // Add DID resolvers here
            },
          }),
        ],
      });

      veramoAgent = agent; // Store outside Redux
      
      return { isInitialized: true };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Veramo initialization failed');
    }
  }
);

const integrationSlice = createSlice({
  name: 'integration',
  initialState,
  reducers: {
    updateFlowConnection: (state, action: PayloadAction<{ address: string | null; isConnected: boolean }>) => {
      state.flow.address = action.payload.address;
      state.flow.isConnected = action.payload.isConnected;
    },
    updateNearConnection: (state, action: PayloadAction<{ accountId: string | null; isConnected: boolean }>) => {
      state.near.accountId = action.payload.accountId;
      state.near.isConnected = action.payload.isConnected;
    },
    disconnectFlow: (state) => {
      state.flow.isConnected = false;
      state.flow.address = null;
      flowAccount = null;
    },
    disconnectNear: (state) => {
      state.near.isConnected = false;
      state.near.accountId = null;
      nearAccount = null;
    },
    disconnectPowergate: (state) => {
      state.powergate.isConnected = false;
      powergateClient = null;
    },
    disconnectDataverse: (state) => {
      state.dataverse.isConnected = false;
    },
    resetVeramo: (state) => {
      state.veramo.isInitialized = false;
      veramoAgent = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Flow
      .addCase(initializeFlow.fulfilled, (state, action) => {
        state.flow.config = action.payload.config;
        state.flow.address = action.payload.address;
        state.flow.isConnected = action.payload.isConnected;
      })
      // NEAR
      .addCase(initializeNear.fulfilled, (state, action) => {
        state.near.config = action.payload.config;
        state.near.accountId = action.payload.accountId;
        state.near.isConnected = action.payload.isConnected;
      })
      // Powergate
      .addCase(initializePowergate.fulfilled, (state, action) => {
        state.powergate.config = action.payload.config;
        state.powergate.isConnected = action.payload.isConnected;
      })
      // Dataverse
      .addCase(initializeDataverse.fulfilled, (state, action) => {
        state.dataverse.config = action.payload.config;
        state.dataverse.isConnected = action.payload.isConnected;
      })
      // Veramo
      .addCase(initializeVeramo.fulfilled, (state, action) => {
        state.veramo.isInitialized = action.payload.isInitialized;
      });
  },
});

export const {
  updateFlowConnection,
  updateNearConnection,
  disconnectFlow,
  disconnectNear,
  disconnectPowergate,
  disconnectDataverse,
  resetVeramo,
} = integrationSlice.actions;

export default integrationSlice.reducer;