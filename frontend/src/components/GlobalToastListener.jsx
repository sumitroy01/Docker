// src/components/GlobalToastListener.jsx
import { useEffect } from "react";
import toast from "react-hot-toast";
import authStore from "../store/auth.store";

export default function GlobalToastListener() {
  const { error, successMessage, clearStatus } = authStore();

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearStatus();
    }
    if (successMessage) {
      toast.success(successMessage);
      clearStatus();
    }
  }, [error, successMessage, clearStatus]);

  return null;
}
