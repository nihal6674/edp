import { createSlice } from "@reduxjs/toolkit";

const requestSlice = createSlice({
  name: "request",
  initialState: {
    status: "idle",         // 'idle' | 'loading' | 'succeeded' | 'failed'
    requestStatus: "free",  // 'free' | 'busy'
    data: null,             // Request data when busy
    error: null,            // Error message if any
  },
  reducers: {
    setRequestLoading: (state) => {
      state.status = "loading";
      state.error = null;
    },
    setRequestSuccess: (state, action) => {
      state.status = "succeeded";
      state.requestStatus = action.payload.status;
     
      state.data = action.payload.data || null;
    },
    setRequestError: (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    },
    clearRequest: (state) => {
      state.status = "idle";
      state.requestStatus = "free";
      state.data = null;
      state.error = null;
    },
  },
});

export const {
  setRequestLoading,
  setRequestSuccess,
  setRequestError,
  clearRequest,
} = requestSlice.actions;

export default requestSlice.reducer;
