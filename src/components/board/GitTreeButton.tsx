"use client";

import React, { useState } from "react";
import { GitTreeViewer } from "./GitTreeViewer";

export function GitTreeButton({ repoUrl }: { repoUrl: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-2 border-sketchy rounded-xl font-bold font-sans text-sm transition-all shadow-sm hover:translate-y-px hover:shadow-[2px_2px_0_#cbd5e1]"
      >
        <span>🌿</span> View Git Tree
      </button>
      
      {isOpen && (
        <GitTreeViewer repoUrl={repoUrl} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}
