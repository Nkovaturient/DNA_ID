import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User } from '../../types';
import * as fcl from '@onflow/fcl';
import { connect, keyStores } from 'near-api-js';

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  network: null,
};

// Flow Authentication
export const authenticateWithFlow = createAsyncThunk(
  'auth/authenticateWithFlow',
  async (_, { rejectWithValue }) => {
    try {
      // Configure FCL
      fcl.config()
        .put('accessNode.api', 'https://rest-testnet.onflow.org')
        .put('challenge.handshake', 'https://fcl-discovery.onflow.org/testnet/authn')
        .put('discovery.wallet', 'https://fcl-discovery.onflow.org/testnet/authn');

      const user = await fcl.authenticate();
      
      if (!user.loggedIn) {
        throw new Error('Authentication failed');
      }

      return {
        id: user.addr,
        address: user.addr,
        network: 'flow' as const,
        profile: {
          name: user.profile?.name,
          avatar: user.profile?.avatar,
        },
        permissions: ['read', 'write', 'create_did'],
        createdAt: new Date(),
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Flow authentication failed');
    }
  }
);

// NEAR Authentication
export const authenticateWithNear = createAsyncThunk(
  'auth/authenticateWithNear',
  async (_, { rejectWithValue }) => {
    try {
      const near = await connect({
        networkId: 'testnet',
        keyStore: new keyStores.BrowserLocalStorageKeyStore(),
        nodeUrl: 'https://rpc.testnet.near.org',
        walletUrl: 'https://wallet.testnet.near.org',
        helperUrl: 'https://helper.testnet.near.org',
        explorerUrl: 'https://explorer.testnet.near.org',
      });

      const wallet = await near.account('');
      const accountId = wallet.accountId;

      if (!accountId) {
        throw new Error('NEAR authentication failed');
      }

      return {
        id: accountId,
        address: accountId,
        network: 'near' as const,
        profile: {
          name: accountId,
        },
        permissions: ['read', 'write', 'create_did'],
        createdAt: new Date(),
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'NEAR authentication failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { getState }) => {
    const state = getState() as { auth: AuthState };
    
    if (state.auth.network === 'flow') {
      await fcl.unauthenticate();
    }
    // NEAR logout is handled by wallet
    
    return null;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUserProfile: (state, action: PayloadAction<Partial<User['profile']>>) => {
      if (state.user) {
        state.user.profile = { ...state.user.profile, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Flow Authentication
      .addCase(authenticateWithFlow.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(authenticateWithFlow.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.network = 'flow';
      })
      .addCase(authenticateWithFlow.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // NEAR Authentication
      .addCase(authenticateWithNear.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(authenticateWithNear.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.network = 'near';
      })
      .addCase(authenticateWithNear.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.network = null;
        state.error = null;
      });
  },
});

export const { clearError, updateUserProfile } = authSlice.actions;
export default authSlice.reducer;