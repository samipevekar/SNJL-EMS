import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../Helpers/axiosinstance";
import { storeToken } from "../../storage/AuthStorage";

const initialState = {
    status: 'idle',
    user: null,
    users: [],
    loading: false,
    error: null
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
    async(_, {rejectWithValue})=>{
        try {
            const response = await axiosInstance.get('/user/me')
            const data = await response.data
            return data
        } catch (error) {
            return rejectWithValue(error?.response.data.error || "Failed to fetch user data")
        }
    }
)

export const registerUserAsync = createAsyncThunk(
    'user/register',
    async(userData, {rejectWithValue})=>{
        try {
            const response = await axiosInstance.post('/user/signup', userData)
            return response.data
        } catch (error) {
            return rejectWithValue(error?.response.data.error || "Registration failed")
        }
    }
)

export const editUserAsync = createAsyncThunk(
    'user/edit',
    async({userId, userData}, {rejectWithValue})=>{
      try {
        const response = await axiosInstance.patch(`user/edit/${userId}`, userData)
        return response.data
      } catch (error) {
        return rejectWithValue(error?.response?.data?.error || "Update failed")
      }
    }
)

export const getUsersAsync = createAsyncThunk(
    'user/getAll',
    async(role, {rejectWithValue})=>{
        try {
            const params = role ? { role } : {}
            const response = await axiosInstance.get('/user', { params })
            return response.data
        } catch (error) {
            return rejectWithValue(error?.response.data.error || "Failed to fetch users")
        }
    }
)

export const authSlice = createSlice({
    name:"auth",
    initialState:initialState,
    reducers:{
        clearUser:(state)=>{
            state.user = null
        },
        clearUsers:(state)=>{
            state.users = []
        }
    },
    extraReducers:(builder)=>{
        builder
        // Login
        .addCase(loginUserAsync.pending, (state)=>{
            state.status = 'loading'
        })
        .addCase(loginUserAsync.fulfilled, (state, action)=>{
            state.status = 'idle'
            state.user = action.payload.user
        })
        .addCase(loginUserAsync.rejected, (state, action)=>{
            state.status = 'idle'
            state.error = action.payload
        })
        
        // Get Me        
        .addCase(getMeAsync.pending, (state)=>{
            state.status = 'loading'
        })
        .addCase(getMeAsync.fulfilled,(state,action)=>{
            state.status = 'idle'
            state.user = action.payload
        })
        .addCase(getMeAsync.rejected, (state, action)=>{
            state.status = 'idle'
            state.error = action.payload
        })
        
        // Register User
        .addCase(registerUserAsync.pending, (state)=>{
            state.loading = true
            state.error = null
            state.status = 'loading'
        })
        .addCase(registerUserAsync.fulfilled, (state, action)=>{
            state.loading = false
            state.users.push(action.payload.user)
            state.status = 'idle'
        })
        .addCase(registerUserAsync.rejected, (state, action)=>{
            state.loading = false
            state.error = action.payload,
            state.status = 'idle'
        })
        
        // Edit User
        .addCase(editUserAsync.pending, (state)=>{
            state.loading = true
            state.error = null
            state.status = 'loading'
        })
        .addCase(editUserAsync.fulfilled, (state, action)=>{
            state.loading = false
            state.status = 'idle'
            const index = state.users.findIndex(u => u.id === action.payload.user.id)
            if(index !== -1) {
                state.users[index] = action.payload.user
            }
        })
        .addCase(editUserAsync.rejected, (state, action)=>{
            state.loading = false
            state.error = action.payload
            state.status = 'idle'

        })
        
        // Get Users
        .addCase(getUsersAsync.pending, (state)=>{
            state.loading = true
            state.error = null
        })
        .addCase(getUsersAsync.fulfilled, (state, action)=>{
            state.loading = false
            state.users = action.payload.users
        })
        .addCase(getUsersAsync.rejected, (state, action)=>{
            state.loading = false
            state.error = action.payload
        })
    }
}) 

export const { clearUser, clearUsers } = authSlice.actions
export const selectUser = (state) => state.auth.user
export const selectUsers = (state) => state.auth.users
export const selectLoginUserStatus = (state) => state.auth.status
export const selectUsersLoading = (state) => state.auth.loading
export const selectUsersError = (state) => state.auth.error

export default authSlice.reducer