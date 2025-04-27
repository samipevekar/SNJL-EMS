import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../Helpers/axiosinstance";

const initialState = {
    status: 'idle',
    shops: []
}

export const getAllShopsAsync = createAsyncThunk(
    'shop/getAllShops',
    async(_,{rejectWithValue})=>{
        try {
            const response = await axiosInstance.get("/shop")
    
            const data = await response.data
    
            return data
        } catch (error) {
            return rejectWithValue(error?.response.data.error || "Network erorr. Please try again")
        }

    }
)

export const getAllExpenseAsync = createAsyncThunk(
    'shop/getAllExpense',
    async({shop_id,sale_date},{rejectWithValue})=>{
        try {
            const response = await axiosInstance.get(`/shop/expenses/${shop_id}`,{
                params:{sale_date}
            })
    
            const data = await response.data    
            return data
        } catch (error) {
            return rejectWithValue(error?.response.data.error || "Network erorr. Please try again")
        }

    }
)

export const getLatestSaleSheetAsync = createAsyncThunk(
    'shop/getLatestSaleSheet',
    async (shop_id, { rejectWithValue }) => {
      try {
        const response = await axiosInstance.get(`/shop/latest/${shop_id}`);
        return response.data;
      } catch (error) {
        return rejectWithValue(error?.response?.data?.error || "Network error. Please try again");
      }
    }
  );
  




export const shopSlice = createSlice({
    name:"shop",
    initialState:initialState,
    reducers:{},
    extraReducers:(builder)=>{
        builder
        .addCase(getAllShopsAsync.pending, (state)=>{
            state.status = 'loading'
        })
        .addCase(getAllShopsAsync.fulfilled, (state,action)=>{
            state.status = 'idle'
            state.shops = action.payload
        })
        .addCase(getAllExpenseAsync.pending, (state)=>{
            state.status = 'loading'
        })
        .addCase(getAllExpenseAsync.fulfilled, (state)=>{
            state.status = 'idle'
        })
        .addCase(getLatestSaleSheetAsync.pending, (state) => {
            state.status = 'loading';
        })
        .addCase(getLatestSaleSheetAsync.fulfilled, (state) => {
            state.status = 'idle';
        })
          
    }
}) 



export const selectShops = (state) => state.shop.shops

export default shopSlice.reducer