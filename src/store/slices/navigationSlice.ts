import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NavigationState, BreadcrumbItem } from '../../types';

const initialState: NavigationState = {
  activeSection: 'home',
  breadcrumbs: [],
  searchQuery: '',
  searchResults: [],
  isSearchOpen: false,
  isMobileMenuOpen: false,
};

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    setActiveSection: (state, action: PayloadAction<string>) => {
      state.activeSection = action.payload;
    },
    setBreadcrumbs: (state, action: PayloadAction<BreadcrumbItem[]>) => {
      state.breadcrumbs = action.payload;
    },
    addBreadcrumb: (state, action: PayloadAction<BreadcrumbItem>) => {
      state.breadcrumbs.push(action.payload);
    },
    removeBreadcrumb: (state, action: PayloadAction<number>) => {
      state.breadcrumbs.splice(action.payload, 1);
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSearchResults: (state, action: PayloadAction<any[]>) => {
      state.searchResults = action.payload;
    },
    toggleSearch: (state) => {
      state.isSearchOpen = !state.isSearchOpen;
    },
    closeSearch: (state) => {
      state.isSearchOpen = false;
      state.searchQuery = '';
      state.searchResults = [];
    },
    toggleMobileMenu: (state) => {
      state.isMobileMenuOpen = !state.isMobileMenuOpen;
    },
    closeMobileMenu: (state) => {
      state.isMobileMenuOpen = false;
    },
  },
});

export const {
  setActiveSection,
  setBreadcrumbs,
  addBreadcrumb,
  removeBreadcrumb,
  setSearchQuery,
  setSearchResults,
  toggleSearch,
  closeSearch,
  toggleMobileMenu,
  closeMobileMenu,
} = navigationSlice.actions;

export default navigationSlice.reducer;