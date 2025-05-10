import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../Helpers/axiosinstance";

const initialState = {
  brands: [],
  status: 'idle',
  error: null,
  addStockStatus: 'idle',
  addStockError: null,
  updateStockStatus: 'idle',
  updateStockError: null,
  deleteStockStatus: 'idle',
  deleteStockError: null,
}

export const fetchStockIncrementBrands = createAsyncThunk(
  'stockIncrementBrands/fetch',
  async (shop_id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/stock-increment/${shop_id}`);
      return response.data;
    } catch (error) {
      console.log(error)
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

export const updateStockIncrement = createAsyncThunk(
  'stockIncrement/update',
  async ({ id, stockData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(`/stock-increment/${id}`, stockData);
      return response.data;
    } catch (error) {
      console.log(error)
      return rejectWithValue(error.response?.data?.error || "Failed to update stock increment");
    }
  }
);

export const deleteStockIncrement = createAsyncThunk(
  'stockIncrement/delete',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/stock-increment/${id}`);
      return response.data;
    } catch (error) {
      console.log(error)
      return rejectWithValue(error.response?.data?.error || "Failed to delete stock increment");
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
    },
    resetUpdateStockStatus: (state) => {
      state.updateStockStatus = 'idle';
      state.updateStockError = null;
    },
    resetDeleteStockStatus: (state) => {
      state.deleteStockStatus = 'idle';
      state.deleteStockError = null;
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
      })
      
      // Update stock increment reducers
      .addCase(updateStockIncrement.pending, (state) => {
        state.updateStockStatus = 'loading';
      })
      .addCase(updateStockIncrement.fulfilled, (state) => {
        state.updateStockStatus = 'succeeded';
      })
      .addCase(updateStockIncrement.rejected, (state, action) => {
        state.updateStockStatus = 'failed';
        state.updateStockError = action.payload;
      })

      // Update stock increment reducers
      .addCase(deleteStockIncrement.pending, (state) => {
        state.deleteStockStatus = 'loading';
      })
      .addCase(deleteStockIncrement.fulfilled, (state) => {
        state.deleteStockStatus = 'succeeded';
      })
      .addCase(deleteStockIncrement.rejected, (state, action) => {
        state.deleteStockStatus = 'failed';
        state.deleteStockError = action.payload;
      });
  }
});

export const { clearBrands, resetAddStockStatus, resetUpdateStockStatus, resetDeleteStockStatus } = stockIncrementSlice.actions;

// Selectors
export const selectStockIncrementBrands = (state) => state.stockIncrement.brands;
export const selectStockIncrementBrandsStatus = (state) => state.stockIncrement.status;
export const selectStockIncrementBrandsError = (state) => state.stockIncrement.error;
export const selectAddStockStatus = (state) => state.stockIncrement.addStockStatus;
export const selectAddStockError = (state) => state.stockIncrement.addStockError;
export const selectUpdateStockStatus = (state) => state.stockIncrement.updateStockStatus;
export const selectUpdateStockError = (state) => state.stockIncrement.updateStockError;
export const selectDeleteStockStatus = (state) => state.stockIncrement.deleteStockStatus;
export const selectDeleteStockError = (state) => state.stockIncrement.deleteStockError;

export default stockIncrementSlice.reducer;