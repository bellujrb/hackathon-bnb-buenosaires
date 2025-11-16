'use client';

import React, { useMemo, useState } from 'react';
import { useArtifact } from '@/contexts/artifact-context';

function parseTable(content: string): Array<Record<string, any>> {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed as Array<Record<string, any>>;
    return [];
  } catch {
    // try CSV
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      return headers.reduce((obj, h, i) => {
        (obj as any)[h] = values[i] || '';
        return obj;
      }, {} as Record<string, any>);
    });
  }
}

export function Artifact() {
  const { artifact, closeArtifact } = useArtifact();
  const [filter, setFilter] = useState<string>('');
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);

  const allRows = useMemo(() => {
    if (!artifact.isVisible) return [];
    if (artifact.kind !== 'sheet') return [];
    return parseTable(artifact.content);
  }, [artifact]);

  const headers = useMemo<string[]>(() => {
    return allRows.length > 0 ? Object.keys(allRows[0]) : [];
  }, [allRows]);

  const filteredRows = useMemo(() => {
    if (!filter.trim()) return allRows;
    const q = filter.toLowerCase();
    return allRows.filter((r) =>
      headers.some((h) => String((r as any)[h] ?? '').toLowerCase().includes(q))
    );
  }, [allRows, filter, headers]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pageRows = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, pageIndex, pageSize]);

  if (!artifact.isVisible) return null;

  return (
    <aside className="fixed top-0 right-0 bottom-0 z-30 w-full sm:w-[42%] md:w-[36%] lg:w-[32%] bg-[rgba(12,12,16,0.88)] backdrop-blur-xl border-l border-white/10 px-4 py-5 overflow-auto">
      <div className="mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold tracking-tight">{artifact.title || 'Artefato'}</h3>
          <button
            onClick={closeArtifact}
            className="text-[13px] rounded-full border border-white/10 px-3 py-1.5 text-gray-200 hover:bg-white/[0.06] transition-colors"
          >
            Fechar
          </button>
        </div>

        {artifact.kind === 'sheet' ? (
          headers.length > 0 ? (
            <div className="w-full rounded-xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.35)] overflow-hidden">
              {/* Controls */}
              <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white/[0.03] border-b border-white/10">
                <input
                  value={filter}
                  onChange={(e) => { setFilter(e.target.value); setPageIndex(0); }}
                  placeholder="Filtrar..."
                  className="w-full max-w-xs rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-white/20"
                />
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <span>Linhas por página</span>
                  <select
                    className="rounded-md bg-black/30 border border-white/10 px-2 py-1"
                    value={pageSize}
                    onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPageIndex(0); }}
                  >
                    {[10,20,30,40,50].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>

              <div className="w-full overflow-auto">
                <table className="w-full text-[13px] border-collapse">
                <thead>
                  <tr className="sticky top-0 z-10">
                    {headers.map((h) => (
                      <th
                        key={h}
                        className="text-left uppercase tracking-wide text-[11px] font-medium text-gray-300 px-4 py-2.5 bg-gradient-to-b from-white/[0.06] to-white/[0.03] backdrop-blur-md border-b border-white/10"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row, idx) => (
                    <tr
                      key={idx}
                      className="odd:bg-white/[0.01] even:bg-transparent hover:bg-white/[0.04] transition-colors"
                    >
                      {headers.map((h) => (
                        <td key={h} className="border-b border-white/5 text-gray-200 px-4 py-2 align-top">
                          {String((row as any)[h] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border-t border-white/10">
                <div className="text-xs text-gray-400">
                  Página {pageIndex + 1} de {totalPages} — {filteredRows.length} linhas
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-md border border-white/10 px-2 py-1 text-xs text-gray-200 disabled:opacity-40"
                    onClick={() => setPageIndex(0)}
                    disabled={pageIndex === 0}
                  >
                    «
                  </button>
                  <button
                    className="rounded-md border border-white/10 px-2 py-1 text-xs text-gray-200 disabled:opacity-40"
                    onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
                    disabled={pageIndex === 0}
                  >
                    ‹
                  </button>
                  <button
                    className="rounded-md border border-white/10 px-2 py-1 text-xs text-gray-200 disabled:opacity-40"
                    onClick={() => setPageIndex((i) => Math.min(totalPages - 1, i + 1))}
                    disabled={pageIndex >= totalPages - 1}
                  >
                    ›
                  </button>
                  <button
                    className="rounded-md border border-white/10 px-2 py-1 text-xs text-gray-200 disabled:opacity-40"
                    onClick={() => setPageIndex(totalPages - 1)}
                    disabled={pageIndex >= totalPages - 1}
                  >
                    »
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-300">Sem dados para exibir.</div>
          )
        ) : (
          <pre className="text-gray-200 text-sm whitespace-pre-wrap">{artifact.content}</pre>
        )}
      </div>
    </aside>
  );
}


