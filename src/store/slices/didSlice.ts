import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DIDState, DID } from '../../types';
import { integrationService } from '../../services/integrationService';

const initialState: DIDState = {
  dids: [],
  selectedDID: null,
  isLoading: false,
  error: null,
  filters: {
    type: 'all',
    status: 'all',
    culturalHeritage: false,
  },
};

export const createDID = createAsyncThunk(
  'did/create',
  async (didData: Partial<DID>, { rejectWithValue }) => {
    try {
      // Use backendService for DID creation
      const { backendService } = await import('../../services/backendService');
      let gdprConsent: { granted: boolean; purposes: string[]; lawfulBasis: 'consent' | 'legitimate_interests' } = { granted: false, purposes: [], lawfulBasis: 'legitimate_interests' };
      if (didData.gdprConsent) {
        gdprConsent = {
          granted: didData.gdprConsent.granted,
          purposes: didData.gdprConsent.purposes,
          lawfulBasis: (didData.gdprConsent as any).lawfulBasis || 'legitimate_interests'
        };
      }
      const didRequest = {
        method: didData.method || 'flow',
        metadata: didData.metadata || { name: '', description: '', type: 'dataset', tags: [] },
        gdprConsent,
        file: (didData as any).file // Pass file if present
      };
      const result = await backendService.createDID(didRequest);
      return result;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create DID');
    }
  }
);

export const fetchDIDs = createAsyncThunk(
  'did/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const dids = await integrationService.fetchDIDs();
      return dids;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch DIDs');
    }
  }
);

export const resolveDID = createAsyncThunk(
  'did/resolve',
  async (didId: string, { rejectWithValue }) => {
    try {
      const did = await integrationService.resolveDID(didId);
      return did;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to resolve DID');
    }
  }
);

export const revokeDID = createAsyncThunk(
  'did/revoke',
  async (didId: string, { rejectWithValue }) => {
    try {
      await integrationService.revokeDID(didId);
      return didId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to revoke DID');
    }
  }
);

const didSlice = createSlice({
  name: 'did',
  initialState,
  reducers: {
    setSelectedDID: (state, action: PayloadAction<DID | null>) => {
      state.selectedDID = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<DIDState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
    updateDID: (state, action: PayloadAction<{ id: string; updates: Partial<DID> }>) => {
      const index = state.dids.findIndex(did => did.id === action.payload.id);
      if (index !== -1) {
        state.dids[index] = { ...state.dids[index], ...action.payload.updates };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Create DID
      .addCase(createDID.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createDID.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dids.push(action.payload);
      })
      .addCase(createDID.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch DIDs
      .addCase(fetchDIDs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDIDs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dids = action.payload;
      })
      .addCase(fetchDIDs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Resolve DID
      .addCase(resolveDID.fulfilled, (state, action) => {
        state.selectedDID = action.payload;
      })
      // Revoke DID
      .addCase(revokeDID.fulfilled, (state, action) => {
        const index = state.dids.findIndex(did => did.id === action.payload);
        if (index !== -1) {
          state.dids[index].status = 'revoked';
        }
      });
  },
});

export const { setSelectedDID, setFilters, clearError, updateDID } = didSlice.actions;
export default didSlice.reducer;