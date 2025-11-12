import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/usersSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
  },
});

// Infer types for dispatch and selector
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
