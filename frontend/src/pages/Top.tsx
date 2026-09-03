import { useState, useEffect } from "react";
import { Chatpanel1 } from "@/ui/container/Chatpanel1.tsx";
import { Chatpanel2 } from "@/ui/container/Chatpanel2.tsx";
import { Chatpanel3 } from "@/ui/container/Chatpanel3.tsx";
import type { ChatMessage } from "@/src/types/chat";
export function Top() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isWindows, setIsWindows] = useState(false);
  const [isSmallWindow, setIsSmallWindow] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [message, setMessage] = useState(() => {
    return localStorage.getItem("currentMessage") ?? "";
  });

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("currentMessage", message);
  }, [message]);

  // Windowsかどうか
  useEffect(() => {
    setIsWindows(navigator.userAgent.includes("Windows"));

    // 画面幅が649px以下かどうか
    const mediaQuery = window.matchMedia("(max-width: 649px)");

    const handleChange = () => {
      setIsSmallWindow(mediaQuery.matches);
    };

    handleChange();

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  // Windowsかつ649px以下
  if (isWindows && isSmallWindow) {
    return (
      <Chatpanel3
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
        messages={messages}
        setMessages={setMessages}
        message={message}
        setMessage={setMessage}
      />
    );
  }

  // Windowsで通常サイズ
  if (isWindows) {
    return (
      <Chatpanel1
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
        messages={messages}
        setMessages={setMessages}
        message={message}
        setMessage={setMessage}
      />
    );
  }

  // それ以外（スマホなど）
  return (
    <Chatpanel2
      isChatOpen={isChatOpen}
      setIsChatOpen={setIsChatOpen}
      messages={messages}
      setMessages={setMessages}
      message={message}
      setMessage={setMessage}
    />
  );
}
