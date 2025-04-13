import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../Helpers/axiosinstance"; // Ensure axiosInstance is set up

const initialState = {
    status: 'idle',
    shopBalanceSheets: [],
    warehouseBalanceSheets: [],
    error: null
};

// Fetch shop balance sheets
export const getShopBalanceSheetsAsync = createAsyncThunk(
    'balanceSheet/getShopBalanceSheets',
    async ({ shop_id, date1, date2 }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get("/balance-sheet/shop", {
                params: { shop_id, date1, date2 }
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error?.response?.data?.error || "Network error. Please try again");
        }
    }
);

// Fetch warehouse balance sheets
export const getWarehouseBalanceSheetsAsync = createAsyncThunk(
    'balanceSheet/getWarehouseBalanceSheets',
    async ({ warehouse_name, date1, date2 }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get("/balance-sheet/warehouse", {
                params: { warehouse_name, date1, date2 }
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error?.response?.data?.error || "Network error. Please try again");
        }
    }
);

export const balanceSheetSlice = createSlice({
    name: "balanceSheet",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Shop balance sheet fetch
            .addCase(getShopBalanceSheetsAsync.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(getShopBalanceSheetsAsync.fulfilled, (state, action) => {
                state.status = 'idle';
                state.shopBalanceSheets = action.payload.transactions;
            })
            .addCase(getShopBalanceSheetsAsync.rejected, (state, action) => {
                state.status = 'idle';
                state.error = action.payload;
            })
            // Warehouse balance sheet fetch
            .addCase(getWarehouseBalanceSheetsAsync.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(getWarehouseBalanceSheetsAsync.fulfilled, (state, action) => {
                state.status = 'idle';
                state.warehouseBalanceSheets = action.payload.transactions;
            })
            .addCase(getWarehouseBalanceSheetsAsync.rejected, (state, action) => {
                state.status = 'idle';
                state.error = action.payload;
            });
    }
});

export const selectShopBalanceSheets = (state) => state.balanceSheet.shopBalanceSheets;
export const selectWarehouseBalanceSheets = (state) => state.balanceSheet.warehouseBalanceSheets;
export const selectBalanceSheetError = (state) => state.balanceSheet.error;

export default balanceSheetSlice.reducer;
