import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../Helpers/axiosinstance";

const initialState = {
    status: 'idle',
    brands: []
}

export const getBrandsAsync = createAsyncThunk(
    'brands/getBrands',
    async({type},{rejectWithValue})=>{
        try {
            const response = await axiosInstance.get("/brand",{params:{type}})
    
            const data = await response.data
    
            return data
        } catch (error) {
            return rejectWithValue(error?.response.data.error || "Network erorr. Please try again")
        }

    }
)


export const brandSlice = createSlice({
    name:"brand",
    initialState:initialState,
    reducers:{
        clearBrands: (state) => {
            state.brands = []
            state.status = 'idle'
        },
    },
    extraReducers:(builder)=>{
        builder
        .addCase(getBrandsAsync.pending, (state)=>{
            state.status = 'loading'
        })
        .addCase(getBrandsAsync.fulfilled, (state,action)=>{
            state.status = 'idle'
            state.brands = action.payload
        })          
    }
}) 


export const { clearBrands }  = brandSlice.actions
export const selectBrands = (state) => state.brand.brands;
export const selectBrandsStatus = (state) => state.brand.status

export default brandSlice.reducer