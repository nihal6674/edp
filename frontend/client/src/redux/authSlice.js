import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    isAuthenticated: false,
    role: null,
    userId: null,
    details: null, // ✅ Add this if you need full details later
  },
  reducers: {
    loginSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.role = action.payload.role;
      state.userId = action.payload.userId;
      state.details = action.payload.details; // ✅ Add this line
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.role = null;
      state.userId = null;
      state.details = null;
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
