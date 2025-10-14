import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "../../types/usersTypes";

interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  user: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.loading = false;
      state.error = null;
    },
    clearUser: (state) => {
      state.user = null;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    updateProfileStats: (
      state,
      action: PayloadAction<{
        numberOfReconciledProfiles: number;
        numberOfUnReconciledProfiles: number;
      }>
    ) => {
      if (state.user) {
        state.user.numberOfReconciledProfiles =
          action.payload.numberOfReconciledProfiles;
        state.user.numberOfUnReconciledProfiles =
          action.payload.numberOfUnReconciledProfiles;
      }
    },
  },
});

export const { setUser, clearUser, setLoading, setError, updateProfileStats } =
  userSlice.actions;

export default userSlice.reducer;
