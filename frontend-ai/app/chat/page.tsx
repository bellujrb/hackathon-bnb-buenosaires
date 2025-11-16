"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Send, Bot, User, CopyIcon, RefreshCcwIcon, ThumbsDownIcon, ThumbsUpIcon, ShareIcon } from "lucide-react";
import { Navbar } from "@/components/ui/mini-navbar";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ui/conversation";
import { Message, MessageContent } from "@/components/ui/message";
import { Actions, Action } from "@/components/ui/actions";
import { useToast } from "@/components/ui/toast";

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
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [dislikedIds, setDislikedIds] = useState<Set<string>>(new Set());
  const hasProcessedInitialMessage = useRef(false);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const isStreaming = isLoading && messages.length > 0 && messages[messages.length - 1]?.role === "assistant";
  const { toast } = useToast();

  const handleLikeMessage = (id: string) => {
    const wasLiked = likedIds.has(id);
    setLikedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        next.add(id);
        // remove dislike if set
        setDislikedIds(dprev => {
          const nd = new Set(dprev);
          nd.delete(id);
          return nd;
        });
      }
      return next;
    });
    if (wasLiked) toast("Like removido");
    else toast("Você curtiu a resposta");
  };

  const handleDislikeMessage = (id: string) => {
    const wasDisliked = dislikedIds.has(id);
    setDislikedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        next.add(id);
        // remove like if set
        setLikedIds(lprev => {
          const nl = new Set(lprev);
          nl.delete(id);
          return nl;
        });
      }
      return next;
    });
    if (wasDisliked) toast("Dislike removido");
    else toast("Você não curtiu a resposta");
  };

  const handleShareMessage = async (content: string) => {
    try {
      if (navigator.share) {
        await navigator.share({ text: content });
        toast("Compartilhado!");
      } else {
        await navigator.clipboard.writeText(content);
        toast("Copiado para compartilhar!");
      }
    } catch {
      // ignore
    }
  };

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

    try {
      const conversationHistory = (skipUser
        ? messages
        : [
            ...messages,
            {
              id: `tmp-${Date.now()}`,
              role: "user" as const,
              content: text,
              timestamp: new Date(),
            },
          ]).map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      }));

      // Cria a mensagem de assistente vazia para streaming
      const assistantId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
        },
      ]);

      // Usa endpoint de streaming (SSE-like via fetch)
      const res = await fetch(`${API_BASE}/api/langgraph/message/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationHistory,
        }),
      });

      if (!res.ok) {
        throw new Error(`Erro na API (${res.status})`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("Não foi possível iniciar o streaming de resposta.");

      let done = false;
      let buffer = "";
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const part of parts) {
            // Formato SSE: "event: xxx" ou "data: {...}"
            if (part.startsWith("event: done")) {
              setIsLoading(false);
              break;
            }
            if (part.startsWith("data: ")) {
              try {
                const payload = JSON.parse(part.replace("data: ", ""));
                if (typeof payload?.text === "string") {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: m.content + payload.text }
                        : m
                    )
                  );
                }
              } catch {
                // ignora linhas não-JSON
              }
            }
          }
        }
      }
    } catch (err: any) {
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: `Falha ao processar sua mensagem. ${err?.message || ""}`.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
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
      <div className="flex-1 px-4 py-8 pb-36" style={{ paddingTop: '100px' }}>
        <div className="max-w-4xl mx-auto w-full h-full relative">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F3BA2F] to-[#F0B90B] flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
            </div>
          ) : (
            <Conversation className="h-full">
              <ConversationContent className="space-y-2">
                {messages.map((m, idx) => (
                  <Message
                    key={m.id}
                    from={m.role}
                    className="flex items-center gap-3"
                  >
                    {m.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F3BA2F] to-[#F0B90B] flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    {m.role === "assistant" ? (
                      <div className="flex flex-col items-start">
                        <MessageContent className="bg-[rgba(255,255,255,0.05)] border border-white/10 backdrop-blur-md text-gray-100">
                          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                            {m.content}
                          </p>
                        </MessageContent>
                        <Actions className="mt-2">
                          <Action
                            tooltip="Tentar novamente"
                            label="Retry"
                            onClick={() => {
                              // encontra a última mensagem do usuário antes deste assistant
                              const prevUser = [...messages]
                                .slice(0, idx)
                                .reverse()
                                .find((mm) => mm.role === "user")?.content;
                              if (prevUser) {
                                // reenvia incluindo a bolha do usuário novamente
                                handleSendMessage(prevUser, false);
                              }
                            }}
                          >
                            <RefreshCcwIcon className="size-4" />
                          </Action>
                          <Action tooltip="Gostei" label="Like" onClick={() => handleLikeMessage(m.id)}>
                            <ThumbsUpIcon className={`size-4 ${likedIds.has(m.id) ? "text-white" : ""}`} />
                          </Action>
                          <Action tooltip="Não gostei" label="Dislike" onClick={() => handleDislikeMessage(m.id)}>
                            <ThumbsDownIcon className={`size-4 ${dislikedIds.has(m.id) ? "text-white" : ""}`} />
                          </Action>
                          <Action tooltip="Copiar" label="Copiar" onClick={async () => { await navigator.clipboard.writeText(m.content); toast("Copiado!"); }}>
                            <CopyIcon className="size-4" />
                          </Action>
                          <Action tooltip="Compartilhar" label="Share" onClick={() => handleShareMessage(m.content)}>
                            <ShareIcon className="size-4" />
                          </Action>
                        </Actions>
                      </div>
                    ) : (
                      <MessageContent className="bg-gradient-to-br from-[#F3BA2F] to-[#F0B90B] text-black">
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                          {m.content}
                        </p>
                      </MessageContent>
                    )}
                    {m.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </Message>
                ))}
                {isLoading && !isStreaming && (
                  <Message from="assistant" className="flex items-center gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F3BA2F] to-[#F0B90B] flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <MessageContent className="bg-[rgba(255,255,255,0.05)] border border-white/10 backdrop-blur-md">
                      <div className="flex gap-1.5">
                        <div className="w-1.5 h-1.5 bg-[#F3BA2F] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-1.5 h-1.5 bg-[#F3BA2F] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-1.5 h-1.5 bg-[#F3BA2F] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </MessageContent>
                  </Message>
                )}
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Estilo da Home (fixo) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-[rgba(15,15,20,0.8)] backdrop-blur-sm px-6 py-4">
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

