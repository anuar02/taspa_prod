"use client";

import { useEffect } from "react";

import { api } from "@/lib/api";
import { socket } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";

type SocketNotification = {
  _id?: string;
  type?: "LIKE" | "COMMENT" | "FOLLOW" | "SAVE";
};

function toMessage(notification: SocketNotification) {
  switch (notification.type) {
    case "LIKE":
      return "Біреу фотоңызды ұнатты";
    case "COMMENT":
      return "Фотоңызға жаңа пікір келді";
    case "FOLLOW":
      return "Жаңа жазылушы пайда болды";
    case "SAVE":
      return "Фотоңыз біреудің сақталған тізіміне қосылды";
    default:
      return "Жаңа хабарлама келді";
  }
}

export function SocketBridge() {
  const user = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const push = useNotificationStore((state) => state.push);

  // Restore session from localStorage on first mount
  useEffect(() => {
    const accessToken = window.localStorage.getItem("taspa.accessToken");
    const refreshToken = window.localStorage.getItem("taspa.refreshToken");
    if (!accessToken) return;

    api
      .get<{ user: { _id: string; username: string; email: string; displayName: string } | null }>("/auth/me")
      .then(({ data }) => {
        if (data.user) {
          setSession({ user: data.user, accessToken, refreshToken: refreshToken ?? "" });
        } else {
          clearSession();
        }
      })
      .catch(() => clearSession());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user?._id) {
      socket.disconnect();
      return;
    }

    socket.connect();
    socket.emit("join", user._id);

    const handleNotification = (notification: SocketNotification) => {
      const id = notification._id ?? `${Date.now()}`;
      push({ id, message: toMessage(notification) });
    };

    const handleLikeUpdated = (payload: { likesCount: number }) => {
      push({
        id: `like-${Date.now()}`,
        message: `Лайктар жаңартылды: ${payload.likesCount}`
      });
    };

    socket.on("notification", handleNotification);
    socket.on("like_updated", handleLikeUpdated);

    return () => {
      socket.emit("leave", user._id);
      socket.off("notification", handleNotification);
      socket.off("like_updated", handleLikeUpdated);
      socket.disconnect();
    };
  }, [push, user]);

  return null;
}
