"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Task, TaskStatus } from "@/types/kanban";
import { TaskItem } from "./TaskItem";

interface ColumnProps {
  status: TaskStatus;
  tasks: Task[];
  currentUserId: string;
  onAddTask?: () => void;
  onDelete?: (taskId: string) => void;
  onApprove?: (taskId: string) => void;
  onReject?: (taskId: string) => void;
}

export function Column({ status, tasks, currentUserId, onAddTask, onDelete, onApprove, onReject }: ColumnProps) {
  const { setNodeRef } = useDroppable({
    id: status,
    data: { type: "Column", status },
  });

  let bgColor = "bg-slate-100";
  if (status === "Done") bgColor = "bg-emerald-100 border-emerald-400 text-emerald-900";
  if (status === "Bugs") bgColor = "bg-rose-100 border-rose-400 text-rose-900";

  return (
    <div className={`flex flex-1 max-h-full min-w-[260px] flex-col gap-4 rounded-xl border-2 border-sketchy ${bgColor} p-4 shrink-0`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">{status}</h2>
          <div className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-200 text-xs font-bold border-sketchy">
            {tasks.length}
          </div>
        </div>
        {status === "To Do" && onAddTask && (
          <button 
            onClick={onAddTask} 
            className="px-2 border-sketchy bg-indigo-500 text-white text-sm font-bold shadow-[2px_2px_0_#cbd5e1] hover:translate-y-px hover:shadow-[1px_1px_0_#cbd5e1] transition-all"
          >
            + Add
          </button>
        )}
      </div>

      <div ref={setNodeRef} className="flex flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden min-h-[200px] no-scrollbar">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} currentUserId={currentUserId} onDelete={onDelete} onApprove={onApprove} onReject={onReject} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
