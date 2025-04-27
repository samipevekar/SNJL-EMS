// stockIncrementBrandsSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../Helpers/axiosinstance";

const initialState = {
  brands: [],
  status: 'idle',
  error: null,
  addStockStatus: 'idle',
  addStockError: null
}

export const fetchStockIncrementBrands = createAsyncThunk(
  'stockIncrementBrands/fetch',
  async (shop_id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/stock-increment/${shop_id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to fetch brands");
    }
  }
);

export const addStockIncrement = createAsyncThunk(
  'stockIncrement/add',
  async (stockData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/stock-increment', stockData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to add stock increment");
    }
  }
);

const stockIncrementSlice = createSlice({
  name: "stockIncrement",
  initialState,
  reducers: {
    clearBrands: (state) => {
      state.brands = [];
      state.status = 'idle';
      state.error = null;
    },
    resetAddStockStatus: (state) => {
      state.addStockStatus = 'idle';
      state.addStockError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch brands reducers
      .addCase(fetchStockIncrementBrands.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchStockIncrementBrands.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.brands = action.payload.data;
      })
      .addCase(fetchStockIncrementBrands.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Add stock increment reducers
      .addCase(addStockIncrement.pending, (state) => {
        state.addStockStatus = 'loading';
      })
      .addCase(addStockIncrement.fulfilled, (state) => {
        state.addStockStatus = 'succeeded';
      })
      .addCase(addStockIncrement.rejected, (state, action) => {
        state.addStockStatus = 'failed';
        state.addStockError = action.payload;
      });
  }
});

export const { clearBrands, resetAddStockStatus } = stockIncrementSlice.actions;

// Selectors
export const selectStockIncrementBrands = (state) => state.stockIncrement.brands;
export const selectStockIncrementBrandsStatus = (state) => state.stockIncrement.status;
export const selectStockIncrementBrandsError = (state) => state.stockIncrement.error;
export const selectAddStockStatus = (state) => state.stockIncrement.addStockStatus;
export const selectAddStockError = (state) => state.stockIncrement.addStockError;

export default stockIncrementSlice.reducer;