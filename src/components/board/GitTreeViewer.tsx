"use client";

import React, { useEffect, useState } from "react";
import { Gitgraph, templateExtend, TemplateName } from "@gitgraph/react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface GitTreeViewerProps {
  repoUrl: string;
  onClose: () => void;
}

interface Commit {
  sha: string;
  message: string;
  author: string;
  parents: string[];
}

export function GitTreeViewer({ repoUrl, onClose }: GitTreeViewerProps) {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCommits() {
      try {
        const res = await fetch(`/api/git-tree?repoUrl=${encodeURIComponent(repoUrl)}`);
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || "Failed to load commits");
        
        // GitHub returns newest first. We reverse to process oldest first to build the tree chronologically
        setCommits((data.commits || []).reverse());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCommits();
  }, [repoUrl]);

  const excalidrawTemplate = templateExtend(TemplateName.Metro, {
    colors: ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"], // Vibrant tailwind colors
    commit: {
      message: {
        displayAuthor: true,
        displayHash: true,
        font: "14px inherit",
        color: "#334155" // slate-700
      },
      dot: {
        size: 8,
        strokeWidth: 2,
        strokeColor: "#0f172a" // slate-900 border
      }
    },
    branch: {
      lineWidth: 4,
      spacing: 40,
      label: {
        display: false
      }
    }
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[200] animate-in fade-in duration-200 p-8">
      <Card className="w-full max-w-4xl max-h-full flex flex-col bg-slate-50 border-4 border-sketchy shadow-[8px_8px_0_#cbd5e1] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b-2 border-slate-200 bg-white shrink-0">
          <div>
            <h2 className="text-2xl font-bold font-sans flex items-center gap-2 text-indigo-900">
              Git Tree
            </h2>
            <p className="text-sm text-slate-500 font-mono mt-1 break-all">{repoUrl}</p>
          </div>
          <Button variant="ghost" className="text-xl w-10 h-10 p-0 rounded-full border-2 border-sketchy bg-slate-100 hover:bg-slate-200" onClick={onClose}>
            ✕
          </Button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 relative flex flex-col items-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 animate-pulse my-auto">
              <div className="text-4xl mb-4">🔮</div>
              <p className="text-lg font-bold">Summoning Git History...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-full text-red-500 text-center max-w-lg mx-auto my-auto">
              <div className="text-4xl mb-4">💔</div>
              <p className="font-bold text-lg mb-2">Failed to load repository</p>
              <p className="text-sm border-2 border-red-200 bg-red-50 p-4 rounded-xl">{error}</p>
            </div>
          )}

          {!loading && !error && commits.length > 0 && (
            <div className="bg-white p-6 pb-4 rounded-2xl border-2 border-sketchy shadow-sm w-full max-w-full shrink-0 font-mono overflow-x-auto">
              <Gitgraph options={{ template: excalidrawTemplate }}>
                {(gitgraph) => {
                  // Prevent React Strict Mode from accumulating duplicate commits on re-renders
                  const renderHash = commits.map(c => c.sha).join("");
                  if ((gitgraph as any).__lastRenderHash === renderHash) return;
                  
                  // Clear graph before re-rendering if clear is available
                  if (typeof (gitgraph as any).clear === 'function') {
                    (gitgraph as any).clear();
                  } else {
                    (gitgraph as any).__lastRenderHash = renderHash;
                  }

                  const branches: Record<string, any> = {};
                  const mainBranch = gitgraph.branch("main");
                  branches["main"] = mainBranch;

                  commits.forEach((c) => {
                    const isMerge = c.parents.length > 1;
                    
                    if (isMerge) {
                      const sideBranch = gitgraph.branch({
                        name: `feature-${c.sha.slice(0, 4)}`,
                        from: mainBranch
                      });
                      sideBranch.commit({
                        subject: "Feature work",
                        author: c.author,
                        hash: `${c.sha.slice(0, 7)}-side`,
                        style: { message: { font: "italic 12px sans-serif", color: "#64748b" } }
                      });
                      mainBranch.merge({
                        branch: sideBranch,
                        commitOptions: {
                          subject: c.message,
                          author: c.author,
                          hash: c.sha.slice(0, 7),
                          style: { dot: { size: 10, strokeColor: "#8b5cf6" } }
                        }
                      });
                    } else {
                      mainBranch.commit({
                        subject: c.message,
                        author: c.author,
                        hash: c.sha.slice(0, 7)
                      });
                    }
                  });
                }}
              </Gitgraph>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
