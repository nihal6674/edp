// store.js
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import requestReducer from "./requestSlice";
import storage from "redux-persist/lib/storage"; // defaults to localStorage
import { persistReducer, persistStore } from "redux-persist";

const persistConfig = {
  key: "root",
  storage,
};

const rootReducer = combineReducers({
  auth: authReducer,
  request: requestReducer, // ✅ Added request slice here
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['register'], // Optional
      },
    }),
});

export const persistor = persistStore(store);
