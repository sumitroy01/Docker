import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

import authStore from "./store/auth.store.js";
import chatstore from "./store/chat.store.js";

import Navbar from "./components/Navbar";
import LoggedOutHome from "./pages/LoggedOutHome";
import ChatPage from "./pages/ChatPage";
import AuthPage from "./pages/AuthPage.jsx";
import ProfileSettings from "./pages/ProfileSettings.jsx";

import { initSocket, getSocket } from "./socket.js";
import { registerSocketListeners } from "./lib/socket-listeners";

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      Loading…
    </div>
  );
}

function App() {
  const { authUser, isCheckingAuth, checkAuth, logOut } = authStore();

  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [activeView, setActiveView] = useState("chat");

  // 🔒 BOOT: AUTH CHECK ONLY
  useEffect(() => {
    checkAuth();
    return () => {
      const s = getSocket();
      if (s) s.disconnect();
    };
  }, []);

  // 🔒 AUTH-DEPENDENT SIDE EFFECTS
  useEffect(() => {
    if (!authUser) {
      const s = getSocket();
      if (s) s.disconnect();
      chatstore.setState({ chats: [], selectedChat: null });
      setActiveView("chat");
      return;
    }

    // logged in
    chatstore.getState().fetchChats(1, 50);

    try {
      initSocket(
        import.meta.env.VITE_BACKEND_URL || window.location.origin
      );
      setTimeout(registerSocketListeners, 50);
    } catch {}
  }, [authUser]);

  const openAuth = (mode) => {
    setAuthMode(mode);
    setShowAuth(true);
  };

  if (isCheckingAuth) {
    return (
      <>
        <FullScreenLoader />
        <Toaster position="top-right" />
      </>
    );
  }

  /* 🔒 HARD BLOCK — THIS IS THE KEY */
  if (!authUser) {
    return (
      <div className="min-h-screen text-white">
        <Navbar
          isLoggedIn={false}
          onShowLogin={() => openAuth("login")}
          onShowSignup={() => openAuth("signup")}
        />

        <AnimatePresence mode="wait">
          {showAuth ? (
            <AuthPage
              initialMode={authMode}
              onBackToLanding={() => setShowAuth(false)}
            />
          ) : (
            <LoggedOutHome
              onShowLogin={() => openAuth("login")}
              onShowSignup={() => openAuth("signup")}
            />
          )}
        </AnimatePresence>

        <Toaster position="top-right" />
      </div>
    );
  }

  /* 🔒 AUTHENTICATED UI ONLY BELOW */
  return (
    <div className="min-h-screen text-white">
      <Navbar
        isLoggedIn
        onLogout={logOut}
        onOpenSettings={() => setActiveView("settings")}
        onGoHome={() => setActiveView("chat")}
        activeView={activeView}
      />

      <main className="mx-auto max-w-6xl px-4 pt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {activeView === "chat" ? <ChatPage /> : <ProfileSettings />}
          </motion.div>
        </AnimatePresence>
      </main>

      <Toaster position="top-right" />
    </div>
  );
}

export default App;
