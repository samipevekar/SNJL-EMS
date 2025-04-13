// src/store/paymentSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../Helpers/axiosinstance";

const initialState = {
  status: 'idle',
  error: null,
  success: false
}

export const addExpenseAsync = createAsyncThunk(
  'payment/addExpense',
  async (expenseData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/expense", expenseData);
      const data = await response.data;

      if (!data.success) {
        return rejectWithValue(data?.error || "Failed to add expense");
      }

      return data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.error || "Network error. Please try again");
    }
  }
);

export const expenseSlice = createSlice({
  name: "expense",
  initialState: initialState,
  reducers: {
    resetExpenseState: (state) => {
      state.status = 'idle';
      state.error = null;
      state.success = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(addExpenseAsync.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.success = false;
      })
      .addCase(addExpenseAsync.fulfilled, (state) => {
        state.status = 'idle';
        state.success = true;
      })
      .addCase(addExpenseAsync.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload;
      });
  }
});

export const { resetExpenseState } = expenseSlice.actions;
export const selectExpenseStatus = (state) => state.expense.status;
export const selectExpenseError = (state) => state.expense.error;
export const selectExpenseSuccess = (state) => state.expense.success;

export default expenseSlice.reducer;