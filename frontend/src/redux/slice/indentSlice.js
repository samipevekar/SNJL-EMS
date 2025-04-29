// indentSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../Helpers/axiosinstance";
import { Alert } from "react-native";

const initialState = {
  status: 'idle',
  indentData: null,
  error: null
}

export const addIndentAsync = createAsyncThunk(
  'indent/addIndent',
  async (indentData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/indent", indentData);
      const data = await response.data;
      
      // if (!data.success) {
      //   return rejectWithValue(data?.error || "Failed to add indent");
      // }
      
      return data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.error || "Network error. Please try again");
    }
  }
);

export const indentSlice = createSlice({
  name: "indent",
  initialState,
  reducers: {
    resetIndentState: (state) => {
      state.status = 'idle';
      state.indentData = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(addIndentAsync.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(addIndentAsync.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.indentData = action.payload.data;
      })
      .addCase(addIndentAsync.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export const { resetIndentState } = indentSlice.actions;
export const selectIndentStatus = (state) => state.indent.status;
export const selectIndentData = (state) => state.indent.indentData;
export const selectIndentError = (state) => state.indent.error;

export default indentSlice.reducer;