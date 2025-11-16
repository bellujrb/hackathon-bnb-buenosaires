'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { UIArtifact, ArtifactKind } from '@/lib/types/artifact';

type ArtifactContextType = {
  artifact: UIArtifact;
  setArtifact: React.Dispatch<React.SetStateAction<UIArtifact>>;
  openArtifact: (kind: ArtifactKind, title: string, content: string) => void;
  closeArtifact: () => void;
};

const initialArtifact: UIArtifact = {
  documentId: 'init',
  content: '',
  kind: 'text',
  title: '',
  status: 'idle',
  isVisible: false,
};

const ArtifactContext = createContext<ArtifactContextType | null>(null);

export function ArtifactProvider({ children }: { children: React.ReactNode }) {
  const [artifact, setArtifact] = useState<UIArtifact>(initialArtifact);

  const openArtifact = useCallback((kind: ArtifactKind, title: string, content: string) => {
    setArtifact({
      documentId: `artifact-${Date.now()}`,
      title,
      kind,
      content,
      isVisible: true,
      status: 'idle',
    });
  }, []);

  const closeArtifact = useCallback(() => {
    setArtifact(prev => ({ ...prev, isVisible: false }));
  }, []);

  const value = useMemo(
    () => ({ artifact, setArtifact, openArtifact, closeArtifact }),
    [artifact, openArtifact, closeArtifact]
  );

  return <ArtifactContext.Provider value={value}>{children}</ArtifactContext.Provider>;
}

export function useArtifact() {
  const ctx = useContext(ArtifactContext);
  if (!ctx) throw new Error('useArtifact must be used within ArtifactProvider');
  return ctx;
}


