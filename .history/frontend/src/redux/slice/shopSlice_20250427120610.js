import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../Helpers/axiosinstance";

const initialState = {
    status: 'idle',
    shops: [],
    shopExpenses: [],
    shop: null,
    loading: false,
    error: null
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

export const getShopByIdAsync = createAsyncThunk(
    'shop/getShopById',
    async(shop_id,{rejectWithValue})=>{
        try {
            const response = await axiosInstance.get(`/shop/${shop_id}`)
    
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
  

  export const createShopAsync = createAsyncThunk(
    'shop/create',
    async (shopData, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post("/shop/create", shopData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error?.response?.data?.error || "Failed to create shop");
        }
    }
);

export const editShopAsync = createAsyncThunk(
    'shop/edit',
    async ({ id, shopData }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.patch(`/shop/${id}`, shopData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || "Failed to update shop");
        }
    }
);




export const shopSlice = createSlice({
    name:"shop",
    initialState:initialState,
    reducers:{
        clearShop: (state)=>{
            state.shop = null
        },
        clearShopStatus: (state) => {
            state.status = 'idle';
            state.error = null;
        }
    },
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
        .addCase(getAllExpenseAsync.fulfilled, (state,action)=>{
            state.status = 'idle'
            state.shopExpenses = action.payload
        })
        .addCase(getLatestSaleSheetAsync.pending, (state) => {
            state.status = 'loading';
        })
        .addCase(getLatestSaleSheetAsync.fulfilled, (state) => {
            state.status = 'idle';
        })
        .addCase(getShopByIdAsync.pending, (state) => {
            state.status = 'loading';
        })
        .addCase(getShopByIdAsync.fulfilled, (state,action) => {
            state.status = 'idle';
            state.shop = action.payload
        })
        .addCase(createShopAsync.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(createShopAsync.fulfilled, (state, action) => {
            state.loading = false;
            state.shops.push(action.payload);
            state.status = 'created';
        })
        .addCase(createShopAsync.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })
        .addCase(editShopAsync.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(editShopAsync.fulfilled, (state, action) => {
            state.loading = false;
            state.shops = state.shops.map(shop => 
                shop.id === action.payload.id ? action.payload : shop
            );
            if (state.shop?.id === action.payload.id) {
                state.shop = action.payload;
            }
            state.status = 'updated';
        })
        .addCase(editShopAsync.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });
          
    }
}) 


export const {clearShop, clearShopStatus} = shopSlice.actions
export const selectShops = (state) => state.shop.shops;
export const selectSpecificShop = (state) => state.shop.shop;
export const selectShopExpenses = (state) => state.shop.shopExpenses;
export const selectShopLoading = (state) => state.shop.loading;
export const selectShopError = (state) => state.shop.error;
export const selectShopStatus = (state) => state.shop.status;


export default shopSlice.reducer