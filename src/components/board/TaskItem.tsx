"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/types/kanban";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface TaskItemProps {
  task: Task;
  currentUserId: string;
  onApprove?: (taskId: string) => void;
  onReject?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onBugFix?: (task: Task) => void;
}

export function TaskItem({ task, currentUserId, onApprove, onReject, onDelete, onBugFix }: TaskItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "Task", task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const isReviewer = currentUserId === task.pending_reviewer_id;
  const bgColor = task.is_pending_approval
    ? "bg-amber-50"
    : task.assignee?.color
    ? task.assignee.color
    : "bg-white";

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none pb-2">
      <Card
        className={`relative flex flex-col gap-2 cursor-grab active:cursor-grabbing ${bgColor}`}
      >
        <div className="flex justify-between items-start">
          <h4 className="font-bold text-lg leading-tight pr-6 break-words whitespace-normal break-all line-clamp-2">{task.title}</h4>
          <div className="flex items-center gap-2 shrink-0">
            {task.assignee && (
              <div className="w-8 h-8 rounded-full border-sketchy overflow-hidden flex items-center justify-center bg-indigo-100">
                {task.assignee.avatar_url ? (
                  <img src={task.assignee.avatar_url} alt={task.assignee.display_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold">{task.assignee.display_name[0].toUpperCase()}</span>
                )}
              </div>
            )}
            {onDelete && (
              <button 
                onPointerDown={(e) => { e.stopPropagation(); onDelete(task.id); }}
                className="text-slate-400 hover:text-red-500 transition-colors p-1"
                title="Delete task"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  <line x1="10" x2="10" y1="11" y2="17" />
                  <line x1="14" x2="14" y1="11" y2="17" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {task.description && (
          <p className="text-sm text-slate-600 line-clamp-2">{task.description}</p>
        )}

        {task.github_branch_url && (
          <a
            href={task.github_branch_url.startsWith('http') ? task.github_branch_url : '#'}
            target="_blank"
            rel="noreferrer"
            onPointerDown={(e) => e.stopPropagation()}
            className="text-xs text-blue-600 hover:underline block truncate max-w-[200px] w-full"
          >
            -Branch- {(() => {
              try {
                return new URL(task.github_branch_url).pathname.split("/").pop();
              } catch (_) {
                return task.github_branch_url;
              }
            })()}
          </a>
        )}

        {task.github_pr_url && (
          <a
            href={task.github_pr_url.startsWith('http') ? task.github_pr_url : '#'}
            target="_blank"
            rel="noreferrer"
            onPointerDown={(e) => e.stopPropagation()}
            className="text-xs text-purple-600 hover:underline block truncate max-w-[200px] w-full"
          >
            -PR- {(() => {
              try {
                return new URL(task.github_pr_url).pathname.split("/").pop();
              } catch (_) {
                return task.github_pr_url;
              }
            })()}
          </a>
        )}

        {task.is_pending_approval && (
          <div className="mt-2 p-2 border-sketchy bg-amber-100 text-amber-900 text-sm">
            <span className="font-bold block mb-1">Pending Approval</span>
            {isReviewer ? (
              <div className="flex gap-2">
                <Button size="sm" variant="default" className="text-xs px-2 py-1" onPointerDown={(e) => { e.stopPropagation(); onApprove?.(task.id) }}>Approve</Button>
                <Button size="sm" variant="danger" className="text-xs px-2 py-1" onPointerDown={(e) => { e.stopPropagation(); onReject?.(task.id) }}>Reject</Button>
              </div>
            ) : (
              <span className="text-xs text-amber-700">Waiting for {task.reviewer?.display_name || "reviewer"}</span>
            )}
          </div>
        )}

        {task.status === "Bugs" && onBugFix && (
          <div className="flex justify-end mt-2">
            <button
              onPointerDown={(e) => { e.stopPropagation(); onBugFix(task); }}
              className="px-3 py-1 text-xs font-bold bg-emerald-500 text-white border-sketchy shadow-[2px_2px_0_#6ee7b7] hover:translate-y-px hover:shadow-[1px_1px_0_#6ee7b7] transition-all flex items-center gap-1"
              title="Mark as fixed and move back to In Progress"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Fix
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}

// Added small helper to ButtonProps globally to keep TS happy if missing size
declare module "@/components/ui/Button" {
  interface ButtonProps {
    size?: "default" | "sm" | "lg";
  }
}
