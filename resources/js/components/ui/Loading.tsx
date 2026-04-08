import * as React from 'react'

export default function Loading({ className }: { className?: string }) {
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm ${className ?? ''}`}>
      <div className="flex flex-col items-center gap-3">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-t-transparent border-sidebar-primary" />
        <div className="text-sm text-white">Ładowanie...</div>
      </div>
    </div>
  )
}
