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
import { Artifact } from "@/components/ui/artifact";
import { useArtifact } from "@/contexts/artifact-context";
import { FunctionExecutionDisplay } from "@/components/chat/function-execution-display";
import { MultimodalInput } from "@/components/chat/multimodal-input";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  tool?: {
    title: string;
    kind: "sheet" | "text";
    content: string;
    count?: number;
  };
}

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openArtifact } = useArtifact();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [importedAddresses, setImportedAddresses] = useState<string[]>([]);
  const [importMeta, setImportMeta] = useState<{ fileName: string; count: number } | null>(null);
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
    let text = messageText ?? input.trim();
    // Allow sending if there are imported addresses even with empty text
    if (((!text || text.length === 0) && importedAddresses.length === 0) || isLoading) return;
    // Do not append addresses to the visible message; keep them hidden in payload.

    // If context-only (no text, only addresses), create ephemeral text for backend validation
    const isContextOnly = (!text || text.length === 0) && importedAddresses.length > 0;
    const textToSend = isContextOnly ? "Context-only: addresses uploaded." : text;
    const shouldShowUserBubble = !isContextOnly && !!text && text.length > 0;

    // Quick rule: if message contains "tabela", open an artifact with a demo sheet
    if (text.toLowerCase().includes("tabela")) {
      const demoRows = [
        { Wallet: "0x1234...abcd", Score: "82", Eligible: "Yes" },
        { Wallet: "0x9876...ffff", Score: "41", Eligible: "No" },
        { Wallet: "0xa1b2...c3d4", Score: "73", Eligible: "Yes" },
      ];
      const toolNotice: Message = {
        id: `tool-${Date.now()}`,
        role: "assistant",
        content: "",
        tool: {
          title: "Tabela de Exemplo",
          kind: "sheet",
          content: JSON.stringify(demoRows),
          count: demoRows.length,
        },
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, toolNotice]);
    }

    if (!skipUser && shouldShowUserBubble) {
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: textToSend,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      // Clear imported addresses after they are used once (remain hidden)
      if (importedAddresses.length > 0) setImportedAddresses([]);
      if (importMeta) setImportMeta(null);
    }

    setIsLoading(true);

    try {
      const conversationHistory = ((skipUser || !shouldShowUserBubble)
        ? messages
        : [
            ...messages,
            {
              id: `tmp-${Date.now()}`,
              role: "user" as const,
              content: textToSend,
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
          message: textToSend,
          conversationHistory,
          // Hidden context to backend
          addresses: importedAddresses,
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

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    handleSendMessage();
  };

  // -------- File import (xlsx / xls / csv) ----------
  const parseCsv = (text: string): any[] => {
    // Simple CSV parser with quotes handling and delimiter auto-detect (',' or ';')
    const rows: any[] = [];
    const bomless = text.replace(/^\uFEFF/, '');
    const lines = bomless.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return rows;
    // Detect delimiter from header line
    const headerLine = lines[0];
    const commaCount = (headerLine.match(/,/g) || []).length;
    const semicolonCount = (headerLine.match(/;/g) || []).length;
    const delimiter = semicolonCount > commaCount ? ';' : ',';
    const split = (line: string): string[] => {
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === delimiter && !inQuotes) {
          result.push(cur);
          cur = '';
        } else {
          cur += ch;
        }
      }
      result.push(cur);
      return result.map((s) => s.trim());
    };
    const headers = split(lines[0]).map((h) => h.trim());
    for (let i = 1; i < lines.length; i++) {
      const cols = split(lines[i]);
      const obj: Record<string, any> = {};
      headers.forEach((h, idx) => {
        obj[h] = cols[idx];
      });
      rows.push(obj);
    }
    return rows;
  };

  const extractAddresses = (rows: any[]): string[] => {
    if (!rows || rows.length === 0) return [];
    const isBscAddress = (v: unknown): v is string =>
      typeof v === 'string' && /^0x[a-fA-F0-9]{40}$/.test(v.trim());
    const headers = Object.keys(rows[0] || {}).map((h) => String(h));
    const headerLooksLikeAddress = (h: string) =>
      /(address|addresses|endereço|endereco|wallet|wallet_address|addr|account|conta|recipient|receiver|to)/i.test(h);
    const candidateHeader = headers.find((h) => headerLooksLikeAddress(h));

    // 1) Best-effort: scan all cells for 0x... patterns (works even without headers)
    const found: string[] = [];
    for (const row of rows) {
      for (const key of Object.keys(row)) {
        const value = row[key];
        if (isBscAddress(value)) found.push(value.trim());
      }
    }

    // 2) If none found, try by header heuristic (first matching header or first column)
    if (found.length === 0) {
      const headerToUse = candidateHeader || headers[0];
      for (const row of rows) {
        const v = row[headerToUse];
        if (isBscAddress(v)) found.push(String(v).trim());
      }
    }

    // Dedupe (case-insensitive)
    const seen = new Set<string>();
    const deduped: string[] = [];
    for (const a of found) {
      const key = a.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(a);
      }
    }
    return deduped;
  };

  const handleFilePicked = async (file: File) => {
    try {
      const ext = file.name.toLowerCase().split('.').pop() || '';
      let rows: any[] = [];
      if (ext === 'csv') {
        const text = await file.text();
        rows = parseCsv(text);
      } else if (ext === 'xlsx' || ext === 'xls') {
        const buf = await file.arrayBuffer();
        const XLSX = await import('xlsx');
        const wb = XLSX.read(buf, { type: 'array' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        rows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as any[];
      } else {
        toast("Formato não suportado. Use .xlsx, .xls ou .csv.");
        return;
      }
      const addresses = extractAddresses(rows);
      if (addresses.length === 0) {
        toast("Nenhum address encontrado no arquivo.");
        return;
      }
      setImportedAddresses(addresses);
      setImportMeta({ fileName: file.name, count: addresses.length });
      toast(`Arquivo importado (${addresses.length} addresses).`);
    } catch (e) {
      toast("Falha ao importar arquivo.");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-[#0a0a0a] via-[#0f0f14] to-[#0a0a0a] text-white relative">
      <Navbar />
      <Artifact />
      
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
                    {m.role === "assistant" && m.tool ? (
                      <FunctionExecutionDisplay
                        metrics={[
                          {
                            toolName: "Tool Display",
                            input: {},
                            output: {
                              data: JSON.parse(m.tool.content || "[]"),
                              log: `${m.tool.count ?? 0} wallets executed`,
                            },
                          },
                        ]}
                        isNewMessage={false}
                      />
                    ) : m.role === "assistant" ? (
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
      <MultimodalInput
        value={input}
        onChange={setInput}
        isStreaming={isLoading}
        onSubmit={() => handleSubmit()}
        onStop={() => setIsLoading(false)}
        onPickFile={handleFilePicked}
        importMeta={importMeta}
        clearImport={() => {
          setImportedAddresses([]);
          setImportMeta(null);
        }}
      />
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

