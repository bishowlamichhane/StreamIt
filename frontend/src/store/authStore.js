// src/store/authStore.js
import { create } from "zustand";
import API from "@/api";
export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoggedIn: false,
  loading: true, // ← NEW

  setAuth: ({ user, accessToken, refreshToken }) =>
    set({
      user,
      accessToken,
      refreshToken,
      isLoggedIn: true,
      loading: false,
    }),

    logout: () =>
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoggedIn: false,
        loading: false,
      }),

      logoutFromServer: async () => {
        try {
          await API.post("/v1/users/logout");
        } catch (err) {
          console.warn("Logout failed on server", err);
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isLoggedIn: false,
            loading: false,
          });
        }
      },
      
  initialAuthentication: async () => {
    set({ loading: true }); // ← Start loading
    try {
      const res = await API.get("/v1/users/current-user");
      const user = res.data.data;

      set({
        user,
        accessToken: null,
        refreshToken: null,
        isLoggedIn: true,
        loading: false,
      });
    } catch (err) {
      console.warn("User not authenticated");
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoggedIn: false,
        loading: false,
      });
    }
  },
}));
