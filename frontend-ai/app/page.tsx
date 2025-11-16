"use client";

import { useRouter } from "next/navigation";
import { HeroWave } from "@/components/ui/ai-input-hero";
import { usePrivy } from "@privy-io/react-auth";
import { useToast } from "@/components/ui/toast";

export default function Home() {
  const router = useRouter();
  const { user, ready } = usePrivy();
  const { toast } = useToast();

  return (
    <HeroWave 
      onPromptSubmit={(value) => {
        const trimmed = value.trim();
        if (!trimmed) return;
        if (!ready || !user) {
          toast("Você precisa estar logado para enviar mensagem.");
          return;
        }
        router.push(`/chat?message=${encodeURIComponent(trimmed)}`);
      }}
    />
  );
}
