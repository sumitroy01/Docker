// src/store/message.store.js
import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import authStore from "./auth.store";

const sortMessagesAsc = (msgs = []) =>
  [...msgs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

const messageStore = create((set, get) => ({
  messagesByChat: {},

  isSendingMessage: false,
  isFetchingMessages: false,
  isMarkingRead: false,
  isDeletingMessage: false,
  isDeletingChat: false,

  // 🔒 AUTH GUARD
  requireAuth() {
    const { authUser } = authStore.getState();
    if (!authUser) throw new Error("Not authenticated");
    return authUser;
  },

  // 📥 FETCH MESSAGES
  fetchMessages: async ({ chatId, page = 1, limit = 50, sort = "asc" }) => {
    try {
      get().requireAuth();
      if (!chatId) return { success: false };

      set({ isFetchingMessages: true });

      const res = await axiosInstance.get(`/api/message/${chatId}`, {
        params: { page, limit, sort },
      });

      const { data = [], page: resPage, limit: resLimit } = res.data || {};
      const hasMore = data.length === resLimit;

      set((state) => {
        const existing = state.messagesByChat[chatId] || { data: [] };
        const merged =
          resPage === 1 ? data : [...existing.data, ...data];

        return {
          messagesByChat: {
            ...state.messagesByChat,
            [chatId]: {
              data: sortMessagesAsc(merged),
              page: resPage,
              limit: resLimit,
              hasMore,
            },
          },
        };
      });

      return { success: true };
    } catch {
      return { success: false };
    } finally {
      set({ isFetchingMessages: false });
    }
  },

  // ✉️ SEND MESSAGE
  sendMessage: async (payload) => {
    try {
      get().requireAuth();
      const chatId =
        payload instanceof FormData ? payload.get("chatId") : payload?.chatId;

      if (!chatId) return { success: false };

      set({ isSendingMessage: true });

      const res = await axiosInstance.post("/api/message", payload);
      const newMessage = res.data;

      set((state) => {
        const existing =
          state.messagesByChat[chatId] || { data: [], page: 1, limit: 50 };

        const exists = existing.data.some(
          (m) =>
            String(m._id) === String(newMessage._id) ||
            (m.clientId && newMessage.clientId && m.clientId === newMessage.clientId)
        );

        const merged = exists
          ? existing.data.map((m) =>
              String(m._id) === String(newMessage._id) ||
              (m.clientId && newMessage.clientId && m.clientId === newMessage.clientId)
                ? { ...m, ...newMessage }
                : m
            )
          : [...existing.data, newMessage];

        return {
          messagesByChat: {
            ...state.messagesByChat,
            [chatId]: {
              ...existing,
              data: sortMessagesAsc(merged),
            },
          },
        };
      });

      return { success: true };
    } catch {
      toast.error("Login required to send message");
      return { success: false };
    } finally {
      set({ isSendingMessage: false });
    }
  },

  // 👁️ MARK AS READ
  markAsRead: async ({ chatId, messageId, userId, silent = false }) => {
    try {
      get().requireAuth();
      if (!chatId && !messageId) return { success: false };

      set({ isMarkingRead: true });

      const body = {};
      if (chatId) body.chatId = chatId;
      if (messageId) body.messageId = messageId;

      await axiosInstance.put("/api/message/read", body);

      set((state) => {
        const updated = { ...state.messagesByChat };

        Object.keys(updated).forEach((cId) => {
          if (chatId && cId !== chatId) return;
          updated[cId] = {
            ...updated[cId],
            data: updated[cId].data.map((m) =>
              messageId && String(m._id) !== String(messageId)
                ? m
                : userId && !m.readBy?.includes(userId)
                ? { ...m, readBy: [...(m.readBy || []), userId] }
                : m
            ),
          };
        });

        return { messagesByChat: updated };
      });

      return { success: true };
    } catch {
      if (!silent) toast.error("Login required");
      return { success: false };
    } finally {
      set({ isMarkingRead: false });
    }
  },

  // 🗑️ DELETE MESSAGE
  deleteMessage: async ({ messageId, chatId }) => {
    try {
      get().requireAuth();
      if (!messageId) return { success: false };

      set({ isDeletingMessage: true });

      await axiosInstance.delete(`/api/message/${messageId}`);

      set((state) => {
        const updated = { ...state.messagesByChat };
        if (chatId && updated[chatId]) {
          updated[chatId] = {
            ...updated[chatId],
            data: updated[chatId].data.filter(
              (m) => String(m._id) !== String(messageId)
            ),
          };
        }
        return { messagesByChat: updated };
      });

      return { success: true };
    } catch {
      toast.error("Login required");
      return { success: false };
    } finally {
      set({ isDeletingMessage: false });
    }
  },

  // 🧹 CLEANUP
  clearMessagesForChat: (chatId) => {
    if (!chatId) return;
    set((state) => {
      const updated = { ...state.messagesByChat };
      delete updated[chatId];
      return { messagesByChat: updated };
    });
  },

  clearAllMessages: () => {
    set({ messagesByChat: {} });
  },
}));

export default messageStore;
