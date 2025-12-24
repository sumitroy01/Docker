// src/store/auth.store.js
import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

const authStore = create((set, get) => ({
  authUser: null,

  isSigningUp: false,
  isLogginIn: false,
  isCheckingAuth: true,
  isResettingPass: false,
  isLogginOut: false,

  verficationPendingId: null,

  error: null,
  successMessage: null,

  clearStatus: () => set({ error: null, successMessage: null }),

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/api/auth/check");
      set({ authUser: res.data });
    } catch {
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signUp: async (data) => {
    set({ isSigningUp: true, error: null });
    try {
      const res = await axiosInstance.post("/api/auth/signup", data);
      set({
        verficationPendingId: res.data.userId,
        successMessage: res.data.message,
      });
      return { success: true };
    } catch (error) {
      set({
        error: error?.response?.data?.message || "Signup failed",
      });
      return { success: false };
    } finally {
      set({ isSigningUp: false });
    }
  },

  verifyUser: async (otp) => {
    const { verficationPendingId, checkAuth } = get();

    if (!verficationPendingId) {
      set({ error: "Invalid user. Please signup again." });
      return { success: false };
    }

    try {
      await axiosInstance.post("/api/auth/verify-user", {
        userId: verficationPendingId,
        otp,
      });

      set({
        verficationPendingId: null,
        successMessage: "Account verified successfully",
      });

      await checkAuth();
      return { success: true };
    } catch (error) {
      set({
        error: error?.response?.data?.message || "Invalid OTP",
      });
      return { success: false };
    }
  },

  logIn: async ({ identifier, password }) => {
    set({ isLogginIn: true, error: null });
    try {
      await axiosInstance.post("/api/auth/login", {
        identifier,
        password,
      });

      await get().checkAuth();
      set({ successMessage: "Logged in successfully" });
      return { success: true };
    } catch (error) {
      const data = error?.response?.data;

      if (data?.needsVerification && data?.userId) {
        set({
          verficationPendingId: data.userId,
          error: data.message,
        });
        return { success: false, needsVerification: true };
      }

      set({ error: data?.message || "Login failed" });
      return { success: false };
    } finally {
      set({ isLogginIn: false });
    }
  },

  logOut: async () => {
    set({ isLogginOut: true });
    try {
      await axiosInstance.post("/api/auth/logout");
      set({ authUser: null });
      return { success: true };
    } finally {
      set({ isLogginOut: false });
    }
  },

  resendOtp: async () => {
    const { verficationPendingId } = get();

    if (!verficationPendingId) {
      set({ error: "No verification pending" });
      return;
    }

    try {
      await axiosInstance.post("/api/auth/resend-otp", {
        userId: verficationPendingId,
      });
      set({ successMessage: "OTP resent successfully" });
    } catch (error) {
      set({
        error: error?.response?.data?.message || "Failed to resend OTP",
      });
    }
  },
}));

export default authStore;
