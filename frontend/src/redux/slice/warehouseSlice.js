import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../Helpers/axiosinstance";

const initialState = {
    status:'idle',
    warehouses: []
}

export const getWarehousesAsync = createAsyncThunk(
    'warehouse/getWarehousesAsync',
    async (_,{rejectWithValue}) => {
      try {
        const response = await axiosInstance.get(`/warehouse`);
        return response.data;
      } catch (error) {
        return rejectWithValue(error?.response?.data?.error || "Network error. Please try again");
      }
    }
  );
  


const warehouseSlice = createSlice({
    name: 'warehouse',
    initialState: initialState,
    reducers:{},
    extraReducers: (builder)=>{
        builder
        .addCase(getWarehousesAsync.pending,(state)=>{
            state.status = 'loading'
        })
        .addCase(getWarehousesAsync.fulfilled,(state,action)=>{
            state.status = 'idle',
            state.warehouses = action.payload
        })
    }
})


export const selectWarehouses = (state) => state.warehouse.warehouses
export const selectWarehouseStatus = (state) => state.warehouse.status

export default warehouseSlice.reducer