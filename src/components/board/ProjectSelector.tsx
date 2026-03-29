"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export function ProjectSelector({
  projects,
  activeProjectId,
}: {
  projects: { id: string; name: string }[];
  activeProjectId: string;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-bold text-slate-700 border-sketchy px-4 py-1.5 bg-slate-100 shadow-[2px_2px_0_#cbd5e1] hover:bg-slate-200 transition-colors"
      >
        <span className="truncate max-w-[150px]">{activeProject?.name}</span>
        <span className="text-[10px] opacity-70">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[120%] min-w-[220px] max-w-[300px] bg-white border-2 border-sketchy shadow-[4px_4px_0_#cbd5e1] z-[100] py-2 flex flex-col">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setIsOpen(false);
                router.push(`/dashboard?project_id=${p.id}`);
              }}
              className={`text-left px-4 py-2 hover:bg-slate-100 transition-colors ${
                p.id === activeProjectId ? "font-bold text-indigo-700 bg-indigo-50/50" : "text-slate-700"
              }`}
            >
              <div className="truncate">{p.name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
