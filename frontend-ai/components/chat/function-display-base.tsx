'use client';

import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useArtifact } from '@/contexts/artifact-context';

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

interface FunctionDisplayBaseProps {
  metrics: FunctionExecution[];
  title?: string;
  icon?: React.ReactNode;
  showParameters?: boolean;
  showResults?: boolean;
  isNewMessage?: boolean;
}

export function FunctionDisplayBase({
  metrics,
  title = 'Funções Executadas',
  icon,
  showParameters = false,
  showResults = true,
  isNewMessage = false,
}: FunctionDisplayBaseProps) {
  const [expandedFunctions, setExpandedFunctions] = useState<Set<number>>(new Set());
  const { openArtifact } = useArtifact();

  if (!metrics?.length) return null;

  const toggleFunction = (index: number) => {
    const next = new Set(expandedFunctions);
    next.has(index) ? next.delete(index) : next.add(index);
    setExpandedFunctions(next);
  };

  const openFunctionDataTable = (func: FunctionExecution) => {
    if (func.output?.data && Array.isArray(func.output.data) && func.output.data.length > 0) {
      openArtifact('sheet', `${func.toolName} - ${func.output.data.length} registro(s)`, JSON.stringify(func.output.data, null, 2));
      return;
    }
    if (func.output?.data && typeof func.output.data === 'object' && !Array.isArray(func.output.data)) {
      const omie = func.output.data as any;
      if (omie.registros && Array.isArray(omie.registros)) {
        const total = omie.total_registros || omie.registros.reduce((acc: number, page: any[]) => acc + page.length, 0);
        openArtifact('sheet', `${func.toolName} - ${total} registro(s)`, JSON.stringify(func.output.data, null, 2));
      }
    }
  };

  const shouldAutoOpen = (toolName: string) => {
    const n = toolName.toLowerCase();
    return n.startsWith('get') || n.startsWith('obter') || n.startsWith('listar');
  };

  const renderParameterValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  useEffect(() => {
    if (isNewMessage) {
      metrics.forEach((func) => {
        if (shouldAutoOpen(func.toolName)) {
          setTimeout(() => openFunctionDataTable(func), 100);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNewMessage]);

  return (
    <div className="pb-2 sm:pb-3 w-full">
      <div className="space-y-3">
        {metrics.map((func, idx) => {
          const isExpanded = expandedFunctions.has(idx);
          const resultsCount =
            (func.output as any)?.total_registros ||
            (Array.isArray(func.output?.data) ? func.output!.data!.length : undefined);
          return (
            <div key={idx} className="rounded-xl border border-white/10 bg-[#1b1c20]">
              <button
                type="button"
                onClick={() => toggleFunction(idx)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left"
              >
                <div>
                  <div className="text-base sm:text-lg font-semibold text-white">{func.toolName}</div>
                  {func.output?.log && (
                    <div className="text-sm text-gray-300 mt-1">
                      {func.output.log}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  {typeof resultsCount !== 'undefined' && (
                    <span className="text-sm">{resultsCount} result(s)</span>
                  )}
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
                  {/* parâmetros ocultos por solicitação */}

                  {showResults && (Array.isArray(func.output?.data) || (func.output?.data && typeof func.output.data === 'object' && !Array.isArray(func.output.data) && (func.output.data as any).registros)) && (
                    <div className="mt-2">
                      <span className="text-xs font-medium text-green-400">
                        ✓ {resultsCount ?? 'N/A'} result(s)
                      </span>
                      {/* Preview of first 3 wallets (or first column) */}
                      <div className="mt-2">
                        {(() => {
                          let rows: any[] = [];
                          if (Array.isArray(func.output?.data)) {
                            rows = func.output!.data!.slice(0, 3);
                          } else if (func.output?.data && (func.output.data as any).registros) {
                            const regs = (func.output.data as any).registros;
                            const flat = Array.isArray(regs) ? regs.flat() : [];
                            rows = flat.slice(0, 3);
                          }
                          if (rows.length === 0) return null;
                          const walletKey =
                            Object.keys(rows[0]).find((k) => k.toLowerCase().includes('wallet')) ||
                            Object.keys(rows[0])[0];
                          return (
                            <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
                              <div className="divide-y divide-white/10">
                                {rows.map((r, i) => (
                                  <div key={i} className="px-3 py-2 text-sm text-gray-200 font-mono">
                                    {String(r[walletKey] ?? '')}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      <div className="mt-3 text-center">
                        <button
                          onClick={() => openFunctionDataTable(func)}
                          className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                        >
                          View Table
                        </button>
                      </div>
                    </div>
                  )}

                  {showResults && func.output?.error && (
                    <div className="mt-3">
                      <span className="text-xs font-medium text-red-400">Erro na execução</span>
                      <div className="mt-1 text-xs text-red-300 p-2 bg-red-900/20 rounded border border-red-800">
                        {func.output.error}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


