// src/redux/slice/paymentSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../Helpers/axiosinstance";

const initialState = {
  status: 'idle',
  error: null,
  success: false
}

export const addWarehousePaymentAsync = createAsyncThunk(
  'payment/addWarehousePayment',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/payment", paymentData);
      const data = await response.data;

      if (!data.success) {
        return rejectWithValue(data?.error || "Failed to add payment");
      }

      return data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.error || "Network error. Please try again");
    }
  }
);

export const paymentSlice = createSlice({
  name: "payment",
  initialState: initialState,
  reducers: {
    resetPaymentState: (state) => {
      state.status = 'idle';
      state.error = null;
      state.success = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(addWarehousePaymentAsync.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.success = false;
      })
      .addCase(addWarehousePaymentAsync.fulfilled, (state) => {
        state.status = 'idle';
        state.success = true;
      })
      .addCase(addWarehousePaymentAsync.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload;
      });
  }
});

export const { resetPaymentState } = paymentSlice.actions;
export const selectPaymentStatus = (state) => state.payment.status;
export const selectPaymentError = (state) => state.payment.error;
export const selectPaymentSuccess = (state) => state.payment.success;

export default paymentSlice.reducer;