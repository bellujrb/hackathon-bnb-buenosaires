"use client";

import { useRouter } from "next/navigation";
import { HeroWave } from "@/components/ui/ai-input-hero";

export default function Home() {
  const router = useRouter();

  return (
    <HeroWave 
      onPromptSubmit={(value) => {
        router.push(`/chat?message=${encodeURIComponent(value)}`);
      }}
    />
  );
}
