'use client'

import React, { useRef, useEffect, useCallback, useState } from 'react'

type MultimodalInputProps = {
  value: string
  onChange: (v: string) => void
  isStreaming: boolean
  onSubmit: () => void
  onStop: () => void
  onPickFile: (file: File) => void
  importMeta: { fileName: string; count: number } | null
  clearImport: () => void
}

export function MultimodalInput({
  value,
  onChange,
  isStreaming,
  onSubmit,
  onStop,
  onPickFile,
  importMeta,
  clearImport,
}: MultimodalInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const placeholders = [
    'Are these wallets eligible for airdrops?',
    'Which wallets are eligible for airdrops?',
    'Which wallets are not eligible for airdrops?',
  ]

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(400, Math.max(40, textareaRef.current.scrollHeight + 2))}px`
    }
  }

  useEffect(() => {
    adjustHeight()
  }, [value])

  useEffect(() => {
    if (value.trim()) return
    const id = setInterval(() => {
      setPlaceholderIdx((p) => (p + 1) % placeholders.length)
    }, 3000)
    return () => clearInterval(id)
  }, [value])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        onSubmit()
      }
    },
    [onSubmit],
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const f = files[0]
      onPickFile(f)
    }
  }, [onPickFile])

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-[rgba(10,10,10,0.85)] backdrop-blur-sm px-6 py-4">
      <div className="max-w-4xl mx-auto">
        <div
          className={`relative bg-white/5 border border-white/10 rounded-2xl shadow-sm transition-all duration-200 ${isDragging ? 'border-green-400 border-2 border-dashed bg-green-50/10' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragging && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bg-white/10 rounded-2xl">
              <div className="flex flex-col items-center gap-2 bg-black/40 p-3 rounded-lg border border-white/20">
                <span className="text-sm font-medium text-white/90">
                  Drop the file to attach
                </span>
              </div>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onPickFile(f)
              if (fileRef.current) fileRef.current.value = ''
            }}
          />

          {/* Main input area */}
          <div className="p-4">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                placeholder={isDragging ? 'Drop the file here...' : ''}
                rows={1}
                className={`w-full resize-none bg-transparent text-white placeholder:text-white/50 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[20px] max-h-[400px] leading-relaxed p-0 pr-10`}
              />

              {!value.trim() && !isDragging && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="text-white/60 text-base leading-relaxed whitespace-pre-wrap break-words">
                    {placeholders[placeholderIdx]}
                  </div>
                </div>
              )}
            </div>

            {/* Import chip */}
            {importMeta && (
              <div className="flex items-center gap-2 bg-white/10 text-white border border-white/20 px-3 py-2 rounded-md mt-3 w-fit">
                <span className="text-xs truncate max-w-[12rem]" title={importMeta.fileName}>
                  {importMeta.fileName} · {importMeta.count}
                </span>
                <button
                  type="button"
                  aria-label="Remove imported addresses"
                  className="text-white/80 hover:text-white"
                  onClick={clearImport}
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-4 pb-4">
            {/* Left side: import button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-white/10 text-white border border-white/20 hover:bg-white/15 transition-colors"
                aria-label="Import file"
                title="Import file (.xlsx, .xls, .csv)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M21 15v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </button>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-3">
              {isStreaming ? (
                <button
                  type="button"
                  onClick={onStop}
                  className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-md border border-white/30 bg-transparent hover:bg-white/10 text-white transition-colors"
                  aria-label="Stop"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <rect x="6" y="6" width="12" height="12" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={!value.trim() && !importMeta}
                  className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-md bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  aria-label="Send"
                  title={value.trim() || importMeta ? 'Send message' : 'Enter a message'}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M7 17L17 7" />
                    <path d="M7 7h10v10" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


