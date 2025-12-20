import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import authStore from "./auth.store";
import { getSocket, markJoinedRoom, markLeftRoom } from "../socket.js";

const normalizeChat = (chat) => {
  if (!chat) return chat;
  const isGroupChat = chat.isGroupChat ?? !!chat.isGroup;
  const users = chat.users || chat.allUsers || [];
  const chatName =
    chat.chatName ||
    chat.groupName ||
    (isGroupChat ? "Group chat" : chat.chatName);

  return { ...chat, isGroupChat, users, chatName };
};

const chatstore = create((set, get) => ({
  chats: [],
  selectedChat: null,

  isFetchingChats: false,
  isAccessingChat: false,
  isCreatingGroup: false,
  isRenamingGroup: false,
  isUpdatingGroup: false,
  isDeletingChat: false,

  page: 1,
  limit: 50,
  hasMore: true,

  // 🔒 auth gate
  requireAuth() {
    const { authUser } = authStore.getState();
    if (!authUser) throw new Error("Not authenticated");
    return authUser;
  },

  setSelectedChat: (chat) => {
    try {
      get().requireAuth();
      const normalized = normalizeChat(chat);
      const prev = get().selectedChat;
      set({ selectedChat: normalized });

      const socket = getSocket();
      if (socket && prev?._id) {
        socket.emit("leave_room", prev._id);
        markLeftRoom(prev._id);
      }
      if (socket && normalized?._id) {
        socket.emit("join_room", normalized._id);
        markJoinedRoom(normalized._id);
      }
    } catch {
      set({ selectedChat: null });
    }
  },

  fetchChats: async (page, limit) => {
    try {
      get().requireAuth();
      set({ isFetchingChats: true });

      const currentPage = page || get().page;
      const currentLimit = limit || get().limit;

      const res = await axiosInstance.get("/api/chat", {
        params: { page: currentPage, limit: currentLimit },
      });

      const data = (res.data?.data || []).map(normalizeChat);
      set({
        chats: currentPage === 1 ? data : [...get().chats, ...data],
        page: currentPage,
        limit: currentLimit,
        hasMore: data.length === currentLimit,
      });
    } catch (error) {
      set({ chats: [], hasMore: false });
    } finally {
      set({ isFetchingChats: false });
    }
  },

  accessChat: async (userId) => {
    try {
      get().requireAuth();
      set({ isAccessingChat: true });

      const res = await axiosInstance.post("/api/chat/access", { userId });
      const chat = normalizeChat(res.data);

      const chats = get().chats;
      const exists = chats.find((c) => c._id === chat._id);

      set({
        chats: exists
          ? chats.map((c) => (c._id === chat._id ? chat : c))
          : [chat, ...chats],
        selectedChat: chat,
      });
    } catch {
      toast.error("Login required to access chat");
    } finally {
      set({ isAccessingChat: false });
    }
  },

  createGroupChat: async (payload) => {
    try {
      get().requireAuth();
      set({ isCreatingGroup: true });

      const res = await axiosInstance.post("/api/chat/group", payload);
      const chat = normalizeChat(res.data);

      set({
        chats: [chat, ...get().chats],
        selectedChat: chat,
      });

      toast.success("Group created");
    } catch {
      toast.error("Login required");
    } finally {
      set({ isCreatingGroup: false });
    }
  },

  renameGroup: async ({ chatId, name }) => {
    try {
      get().requireAuth();
      set({ isRenamingGroup: true });

      const res = await axiosInstance.put("/api/chat/rename", { chatId, name });
      const updated = normalizeChat(res.data);

      set({
        chats: get().chats.map((c) =>
          c._id === updated._id ? updated : c
        ),
        selectedChat:
          get().selectedChat?._id === updated._id
            ? updated
            : get().selectedChat,
      });
    } catch {
      toast.error("Login required");
    } finally {
      set({ isRenamingGroup: false });
    }
  },

  deleteChat: async (chatId) => {
    try {
      get().requireAuth();
      set({ isDeletingChat: true });

      await axiosInstance.delete(`/api/chat/${chatId}`);
      set({
        chats: get().chats.filter((c) => c._id !== chatId),
        selectedChat:
          get().selectedChat?._id === chatId ? null : get().selectedChat,
      });

      toast.success("Chat deleted");
    } catch {
      toast.error("Login required");
    } finally {
      set({ isDeletingChat: false });
    }
  },
}));

export default chatstore;
