// src/store/user.store.js
import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import authStore from "./auth.store";

const userstore = create((set, get) => ({
  userFound: null,
  isUpdatingProfile: false,
  isUpdatingEmail: false,
  isSearchingUser: false,

  // 🔒 helper: ensure user is authenticated
  requireAuth() {
    const { authUser } = authStore.getState();
    if (!authUser) {
      throw new Error("Not authenticated");
    }
    return authUser;
  },

  // 🔍 search other users (public)
  findUser: async (userName) => {
    const value = userName && userName.trim();
    if (!value) return;

    set({ isSearchingUser: true, userFound: null });

    try {
      const res = await axiosInstance.get("/api/user/get/user", {
        params: { userName: value },
      });
      const user = res.data?.user ?? res.data;
      set({ userFound: user || null });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        "failed to search user";

      toast.error(message);
      set({ userFound: null });
    } finally {
      set({ isSearchingUser: false });
    }
  },

  // 🧑 update own profile (auth required)
  updateProfile: async ({ name, userName, avatar, avatarFile }) => {
    try {
      get().requireAuth();
      set({ isUpdatingProfile: true });

      const formData = new FormData();
      if (name !== undefined) formData.append("name", name);
      if (userName !== undefined) formData.append("userName", userName);
      if (avatarFile) formData.append("avatar", avatarFile);
      else if (avatar) formData.append("avatar", avatar);

      await axiosInstance.post("/api/user/update-profile", formData);
      toast.success("Profile updated successfully");
      return { success: true };
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update profile");
      return { success: false };
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  // 📧 request email change (auth required)
  requestEmailUpdate: async ({ email, password }) => {
    try {
      get().requireAuth();
      set({ isUpdatingEmail: true });

      await axiosInstance.post("/api/user/email/change/request", {
        email,
        password,
      });

      toast.success("OTP sent to your new email");
      return { success: true };
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error("This email is already in use");
      } else if (error.response?.status === 401) {
        toast.error("Incorrect password");
      } else {
        toast.error(error?.response?.data?.message || "Failed to request email change");
      }
      return { success: false };
    } finally {
      set({ isUpdatingEmail: false });
    }
  },

  // 📧 confirm email change (auth required)
  updateEmail: async (otp) => {
    try {
      get().requireAuth();
      set({ isUpdatingEmail: true });

      await axiosInstance.post("/api/user/email/change/confirm", { otp });
      toast.success("Email updated successfully");
      return { success: true };
    } catch (error) {
      toast.error(
        error.response?.status === 400
          ? "Invalid or expired OTP"
          : "Failed to verify email"
      );
      return { success: false };
    } finally {
      set({ isUpdatingEmail: false });
    }
  },

  // 🗑️ delete account (auth required)
  requestDeleteAccount: async (password) => {
    try {
      get().requireAuth();
      await axiosInstance.post("/api/user/delete-account/request", { password });
      toast.success("OTP sent to your email");
      return { success: true };
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to request account deletion"
      );
      return { success: false };
    }
  },

  confirmDeleteAccount: async (otp) => {
    try {
      get().requireAuth();
      await axiosInstance.post("/api/user/delete-account/confirm", { otp });

      toast.success("Account deleted successfully");
      authStore.getState().logOut(); // 🔥 hard logout
      return { success: true };
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to delete account"
      );
      return { success: false };
    }
  },

  resendEmailOtp: async () => {
    try {
      get().requireAuth();
      await axiosInstance.post("/api/user/email/change/resend");
      toast.success("OTP resent to your email");
    } catch {
      toast.error("Please try again later");
    }
  },
}));

export default userstore;
