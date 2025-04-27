import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../Helpers/axiosinstance";

export const fetchAttendanceByShop = createAsyncThunk(
  'attendance/fetchByShop',
  async ({ shop_id, month, year, role }, { rejectWithValue }) => {
    try {
      const params = {};
      if (month) params.month = month;
      if (year) params.year = year;
      if (role) params.role = role;
      
      const response = await axiosInstance.get(`/attendance/${shop_id}`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch attendance");
    }
  }
);

export const markAttendanceWithFace = createAsyncThunk(
  'attendance/markWithFace',
  async ({ user_id, image }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/attendance', {
        user_id,
        image
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to mark attendance");
    }
  }
);

const initialState = {
  status: 'idle',
  error: null,
  data: [],
  loading: false,
  faceAttendanceStatus: null,
  faceAttendanceLoading: false,
  faceAttendanceError: null
};

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    clearAttendanceData: (state) => {
      state.data = [];
    },
    resetFaceAttendance: (state) => {
      state.faceAttendanceStatus = null;
      state.faceAttendanceError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendanceByShop.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendanceByShop.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchAttendanceByShop.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(markAttendanceWithFace.pending, (state) => {
        state.faceAttendanceLoading = true;
        state.faceAttendanceError = null;
        state.faceAttendanceStatus = null;
      })
      .addCase(markAttendanceWithFace.fulfilled, (state, action) => {
        state.faceAttendanceLoading = false;
        state.faceAttendanceStatus = action.payload;
      })
      .addCase(markAttendanceWithFace.rejected, (state, action) => {
        state.faceAttendanceLoading = false;
        state.faceAttendanceError = action.payload;
      });
  }
});

export const { clearAttendanceData, resetFaceAttendance } = attendanceSlice.actions;
export const selectAttendanceData = (state) => state.attendance.data;
export const selectAttendanceLoading = (state) => state.attendance.loading;
export const selectAttendanceError = (state) => state.attendance.error;
export const selectFaceAttendanceStatus = (state) => state.attendance.faceAttendanceStatus;
export const selectFaceAttendanceLoading = (state) => state.attendance.faceAttendanceLoading;
export const selectFaceAttendanceError = (state) => state.attendance.faceAttendanceError;

export default attendanceSlice.reducer;