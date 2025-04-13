import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../Helpers/axiosinstance";
import { storeToken } from "../../storage/AuthStorage";

const initialState = {
    status: 'idle',
    user: null
}

export const loginUserAsync = createAsyncThunk(
    'user/loginUser',
    async(credentials,{rejectWithValue})=>{
        try {
            const response = await axiosInstance.post("/user/login",{
                email: credentials.email,
                password: credentials.password
            })
    
            const data = await response.data
    
            if(!data.success){
                return rejectWithValue(data?.error || "Login failed");
            }

            if(data.token){
                await storeToken(data.token)
            }
    
            return data
        } catch (error) {
            return rejectWithValue(error?.response.data.error || "Network erorr. Please try again")
        }

    }
)

export const getMeAsync = createAsyncThunk(
    '/user/getMe',
    async()=>{
        try {
            const response = await axiosInstance.get('/user/me')
            const data = await response.data
            return data
        } catch (error) {
            console.log(error.message)
        }
    }
)

export const authSlice = createSlice({
    name:"auth",
    initialState:initialState,
    reducers:{},
    extraReducers:(builder)=>{
        builder.
        addCase(loginUserAsync.pending, (state)=>{
            state.status = 'loading'
        })
        .addCase(loginUserAsync.fulfilled, (state)=>{
            state.status = 'idle'
        })
        .addCase(loginUserAsync.rejected, (state)=>{
            state.status = 'idle'
        })        
        .addCase(getMeAsync.pending, (state)=>{
            state.status = 'loading'
        })
        .addCase(getMeAsync.fulfilled,(state,action)=>{
            state.status = 'idle'
            state.user = action.payload
        })
    }
}) 



export const selectUser = (state) => state.auth.user
export const selectLoginUserStatus = (state) => state.auth.status

export default authSlice.reducer