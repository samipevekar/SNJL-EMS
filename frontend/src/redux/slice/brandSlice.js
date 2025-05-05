// src/store/slices/brandSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Alert } from "react-native";
import axiosInstance from "../../Helpers/axiosinstance";

const initialState = {
    status: 'idle',
    brands: [],
    currentBrand: null,
    loading: false,
    error: null
}

export const getBrandsAsync = createAsyncThunk(
    'brands/getBrands',
    async({type}, {rejectWithValue}) => {
        try {
            const response = await axiosInstance.get("/brand", {params: {type}});
            return response.data;
        } catch (error) {
            return rejectWithValue(error?.response?.data?.error || "Network error. Please try again");
        }
    }
);

export const getSpecificBrandAsync = createAsyncThunk(
    'brands/getSpecificBrand',
    async (id, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`/brand/one/${id}`);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error?.response?.data?.error || "Failed to fetch brand details");
        }
    }
);

export const addBrandAsync = createAsyncThunk(
    'brands/addBrand',
    async (brandData, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post("/brand", brandData);
            Alert.alert("Success","Brand added successfully");
            return response.data.brand;
        } catch (error) {
            Alert.alert("Error",error?.response?.data?.error || "Failed to add brand");
            return rejectWithValue(error?.response?.data?.error || "Failed to add brand");
        }
    }
);

export const editBrandAsync = createAsyncThunk(
    'brands/editBrand',
    async ({ id, brandData }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.patch(`/brand/${id}`, brandData);
            Alert.alert("Success","Brand updated successfully");
            return { id, brand: response.data.brand };
        } catch (error) {
            Alert.alert("Error",error?.response?.data?.error || "Failed to update brand");
            return rejectWithValue(error?.response?.data?.error || "Failed to update brand");
        }
    }
);

export const brandSlice = createSlice({
    name: "brand",
    initialState,
    reducers: {
        clearBrands: (state) => {
            state.brands = [];
            state.status = 'idle';
        },
        clearCurrentBrand: (state) => {
            state.currentBrand = null;
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(getBrandsAsync.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(getBrandsAsync.fulfilled, (state, action) => {
                state.status = 'idle';
                state.brands = action.payload;
            })
            .addCase(getBrandsAsync.rejected, (state, action) => {
                state.status = 'idle';
                state.error = action.payload;
            })
            .addCase(getSpecificBrandAsync.pending, (state) => {
                state.loading = true;
            })
            .addCase(getSpecificBrandAsync.fulfilled, (state, action) => {
                state.loading = false;
                state.currentBrand = action.payload;
            })
            .addCase(getSpecificBrandAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(addBrandAsync.pending, (state) => {
                state.loading = true;
            })
            .addCase(addBrandAsync.fulfilled, (state, action) => {
                state.loading = false;
                state.brands.push(action.payload);
            })
            .addCase(addBrandAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(editBrandAsync.pending, (state) => {
                state.loading = true;
            })
            .addCase(editBrandAsync.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.brands.findIndex(brand => brand.id === action.payload.id);
                if (index !== -1) {
                    state.brands[index] = action.payload.brand;
                }
                if (state.currentBrand && state.currentBrand.id === action.payload.id) {
                    state.currentBrand = action.payload.brand;
                }
            })
            .addCase(editBrandAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { clearBrands, clearCurrentBrand, clearError } = brandSlice.actions;
export const selectBrands = (state) => state.brand.brands;
export const selectCurrentBrand = (state) => state.brand.currentBrand;
export const selectBrandsStatus = (state) => state.brand.status;
export const selectBrandsLoading = (state) => state.brand.loading;
export const selectBrandsError = (state) => state.brand.error;

export default brandSlice.reducer;