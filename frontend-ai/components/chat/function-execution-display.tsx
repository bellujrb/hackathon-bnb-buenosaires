'use client';

import React from 'react';
import { FunctionDisplayBase } from './function-display-base';

type FunctionExecution = {
  toolName: string;
  input: Record<string, any>;
  output: {
    data?: any;
    log?: string;
    error?: string;
    total_registros?: number;
  };
};

interface FunctionExecutionDisplayProps {
  metrics: FunctionExecution[];
  isNewMessage?: boolean;
}

export function FunctionExecutionDisplay({ metrics, isNewMessage = false }: FunctionExecutionDisplayProps) {
  if (!metrics || metrics.length === 0) return null;
  const functionName = metrics[0]?.toolName || 'Função Executada';

  return (
    <FunctionDisplayBase
      metrics={metrics}
      title={functionName}
      showParameters={true}
      showResults={true}
      isNewMessage={isNewMessage}
    />
  );
}


