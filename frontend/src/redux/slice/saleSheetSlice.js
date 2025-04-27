// saleSheetSlice.js (updated)
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../Helpers/axiosinstance";

export const createSaleSheetAsync = createAsyncThunk(
  'saleSheet/create',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/sale-sheet/create', formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Submission failed");
    }
  }
);

export const fetchSaleSheetsAsync = createAsyncThunk(
  'saleSheet/fetch',
  async ({ shop_id, sale_date, latest }, { rejectWithValue }) => {
    try {
      const params = {};
      if (sale_date) params.sale_date = sale_date;
      if (latest) params.latest = latest;
      
      const response = await axiosInstance.get(`/sale-sheet/sheets/${shop_id}`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Fetch failed");
    }
  }
);

export const fetchSaleSheetByIdAsync = createAsyncThunk(
  'saleSheet/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/sale-sheet/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Fetch failed");
    }
  }
);

export const updateSaleSheetAsync = createAsyncThunk(
  'saleSheet/update',
  async ({ id, sale, upi, expenses }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(`/sale-sheet/update/${id}`, {
        sale,
        upi,
        expenses
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Update failed");
    }
  }
);

const initialSaleSheetState = {
  status: 'idle',
  error: null,
  saleSheets: [],
  loading: false,
  currentSaleSheet: null, // Add this for storing single sheet
  detailLoading: false, // Separate loading state for detail view
};

const saleSheetSlice = createSlice({
  name: 'saleSheet',
  initialState: initialSaleSheetState,
  reducers: {
    clearSaleSheetStatus: (state) => {
      state.status = 'idle';
      state.error = null;
    },
    clearSaleSheets: (state) => {
      state.saleSheets = [];
    },
    clearCurrentSaleSheet: (state) => {
      state.currentSaleSheet = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createSaleSheetAsync.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createSaleSheetAsync.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(createSaleSheetAsync.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload.error;
      })
      .addCase(fetchSaleSheetsAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSaleSheetsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.saleSheets = action.payload;
      })
      .addCase(fetchSaleSheetsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.error;
      })
      .addCase(fetchSaleSheetByIdAsync.pending, (state) => {
        state.detailLoading = true;
      })
      .addCase(fetchSaleSheetByIdAsync.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.currentSaleSheet = action.payload;
      })
      .addCase(fetchSaleSheetByIdAsync.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload.error;
      })
      .addCase(updateSaleSheetAsync.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateSaleSheetAsync.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Update the specific sale sheet in the array
        state.saleSheets = state.saleSheets.map(sheet => 
          sheet.id === action.payload.id ? action.payload : sheet
        );
        // Also update currentSaleSheet if it's the one being edited
        if (state.currentSaleSheet?.id === action.payload.id) {
          state.currentSaleSheet = action.payload;
        }
      })
      .addCase(updateSaleSheetAsync.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.error || "Update failed";
      })
  },
});

export const { clearSaleSheetStatus, clearSaleSheets, clearCurrentSaleSheet } = saleSheetSlice.actions;
export const selectSaleSheetStatus = (state) => state.saleSheet.status;
export const selectSaleSheetError = (state) => state.saleSheet.error;
export const selectSaleSheets = (state) => state.saleSheet.saleSheets;
export const selectSaleSheetsLoading = (state) => state.saleSheet.loading;
export const selectCurrentSaleSheet = (state) => state.saleSheet.currentSaleSheet;
export const selectDetailLoading = (state) => state.saleSheet.detailLoading;

export default saleSheetSlice.reducer;