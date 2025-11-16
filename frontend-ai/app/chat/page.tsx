"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Send, Bot, User } from "lucide-react";
import { Navbar } from "@/components/ui/mini-navbar";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasProcessedInitialMessage = useRef(false);

  const handleSendMessage = async (messageText?: string, skipUser = false) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    if (!skipUser) {
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
    }

    setIsLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: `Entendi sua solicitação: "${text}". Estou processando e em breve retornarei com uma resposta completa.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check for initial message from hero page
  useEffect(() => {
    const initialMessage = searchParams.get("message");
    if (initialMessage && !hasProcessedInitialMessage.current && messages.length === 0) {
      hasProcessedInitialMessage.current = true;
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: initialMessage,
        timestamp: new Date(),
      };
      setMessages([userMessage]);
      // Simulate AI response
      handleSendMessage(initialMessage, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-[#0a0a0a] via-[#0f0f14] to-[#0a0a0a] text-white relative">
      <Navbar />
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-8" style={{ paddingTop: '100px' }}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F3BA2F] to-[#F0B90B] flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F3BA2F] to-[#F0B90B] flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-gradient-to-br from-[#F3BA2F] to-[#F0B90B] text-black"
                      : "bg-[rgba(255,255,255,0.05)] border border-white/10 backdrop-blur-md text-gray-100"
                  }`}
                >
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F3BA2F] to-[#F0B90B] flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-[rgba(255,255,255,0.05)] border border-white/10 backdrop-blur-md rounded-2xl px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-[#F3BA2F] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 bg-[#F3BA2F] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 bg-[#F3BA2F] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Estilo da Home */}
      <div className="border-t border-white/10 bg-[rgba(15,15,20,0.8)] backdrop-blur-sm px-6 py-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="relative rounded-2xl p-[2px] shadow-[0_1px_2px_0_rgba(0,0,0,0.06)] bg-gradient-to-br from-white/10 via-white/5 to-black/20">
            <div className="relative rounded-2xl bg-[rgba(15,15,20,0.55)] border border-white/10 backdrop-blur-md">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim() && !isLoading) {
                      handleSendMessage();
                    }
                  }
                }}
                placeholder=""
                rows={1}
                className="w-full resize-none rounded-2xl bg-transparent text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#F3BA2F]/40 focus:border-[#F3BA2F]/40 px-4 py-3 pr-14 min-h-[52px] max-h-32 overflow-y-auto"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-3 bottom-3 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#F3BA2F] text-black hover:bg-[#F0B90B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Enviar"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M7 17L17 7"/>
                  <path d="M7 7h10v10"/>
                </svg>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-[#0a0a0a] via-[#0f0f14] to-[#0a0a0a]">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F3BA2F] to-[#F0B90B] flex items-center justify-center animate-pulse">
          <Bot className="w-6 h-6 text-white" />
        </div>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}

