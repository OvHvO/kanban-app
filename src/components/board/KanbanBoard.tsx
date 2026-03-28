"use client";

import React, { useState, useTransition, useEffect } from "react";
import { updateTaskAction } from "@/app/actions/kanban";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { Task, TaskStatus, Profile } from "@/types/kanban";
import { Column } from "./Column";
import { TaskItem } from "./TaskItem";
import { DraggableAvatar } from "./DraggableAvatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

interface KanbanBoardProps {
  projectId: string;
  initialTasks: Task[];
  currentUserId: string;
  projectMembers: Profile[];
}

export function KanbanBoard({ projectId, initialTasks, currentUserId, projectMembers }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeMember, setActiveMember] = useState<Profile | null>(null);
  const [isPending, startTransition] = useTransition();

  // Sync server changes (e.g., after revalidatePath) to local state
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Modal states
  const [createModalProps, setCreateModalProps] = useState<{ open: boolean }>({ open: false });
  const [createTaskTitle, setCreateTaskTitle] = useState("");
  const [createTaskDesc, setCreateTaskDesc] = useState("");

  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const [branchModal, setBranchModal] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });
  const [prModal, setPrModal] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });
  const [reviewModal, setReviewModal] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; taskId: string | null }>({ open: false, taskId: null });

  // Input states
  const [urlInput, setUrlInput] = useState("");
  const [selectedReviewer, setSelectedReviewer] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const columns: TaskStatus[] = ["To Do", "In Progress", "Code Review", "Done", "Bugs"];

  const onDragStart = (e: DragStartEvent) => {
    const { active } = e;
    if (active.data.current?.type === "Task") {
      setActiveTask(active.data.current.task);
    } else if (active.data.current?.type === "Member") {
      setActiveMember(active.data.current.member as Profile);
    }
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActiveTask(null);
    setActiveMember(null);
    const { active, over } = e;
    if (!over) return;

    if (active.data.current?.type === "Member") {
      const draggedMember = active.data.current.member as Profile;
      const overTaskId = over.id as string;
      const targetTask = tasks.find(t => t.id === overTaskId);
      
      if (targetTask) {
        // Optimistically assign user to task!
        updateTaskStatus(targetTask.id, targetTask.status, {
          assignee_id: draggedMember.id,
          assignee: draggedMember,
        });
      }
      return;
    }

    const activeTask = active.data.current?.task as Task;
    const overId = over.id as TaskStatus | string;

    let overStatus: TaskStatus;
    if (columns.includes(overId as TaskStatus)) {
      overStatus = overId as TaskStatus;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      overStatus = overTask?.status || activeTask.status;
    }

    if (activeTask.status === overStatus) {
      // Reordering within same column
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);
      if (oldIndex !== newIndex) {
        setTasks((tasks) => arrayMove(tasks, oldIndex, newIndex));
      }
      return;
    }

    // Logic: Validate Transition!
    const isValidTransition = (from: TaskStatus, to: TaskStatus) => {
      if (from === to) return true;
      if (to === "Bugs" || from === "Bugs") return true; // Anyone can go to Bugs, Bugs can go anywhere
      
      const flow = ["To Do", "In Progress", "Code Review", "Done"];
      const fromIndex = flow.indexOf(from);
      const toIndex = flow.indexOf(to);
      
      // Moving Forward: only 1 step at a time!
      if (toIndex - fromIndex === 1) return true;
      
      // Moving Backward: Any amount is fine (e.g. from Review back to To Do)
      if (toIndex < fromIndex) return true;
      
      return false;
    };

    if (!isValidTransition(activeTask.status, overStatus)) {
      setAlertMessage(`You cannot skip phases. You must move sequentially from '${activeTask.status}' to the next logical step.`);
      return;
    }

    // Status changed, intercept for Modals
    if (activeTask.status === "To Do" && overStatus === "In Progress") {
      setBranchModal({ open: true, task: activeTask });
      return;
    }

    if (activeTask.status === "In Progress" && overStatus === "Code Review") {
      setPrModal({ open: true, task: activeTask });
      return;
    }

    if (activeTask.status === "Code Review" && overStatus === "Done") {
      setReviewModal({ open: true, task: activeTask });
      return;
    }

    // Default optimistic update
    updateTaskStatus(activeTask.id, overStatus);
  };

  const validateUrl = (url: string) => {
    if (!url.startsWith("http://") && !url.startsWith("https://")) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const updateTaskStatus = (taskId: string, newStatus: TaskStatus, extraData: Partial<Task> = {}) => {
    // Optimistic UI Update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: newStatus, ...extraData } : t
      )
    );
    
    // Real Database Mutation
    startTransition(() => {
      updateTaskAction(taskId, newStatus, extraData);
    });
  };

  return (
    <>
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex flex-col h-full w-full bg-slate-50 overflow-hidden">
        
        {/* TEAM ROSTER STRIP */}
        <div className="flex gap-4 p-4 px-8 mx-4 items-center shrink-0 border-2 border-slate-200 border-sketchy bg-white z-10 shadow-sm relative rounded-xl">
          <span className="font-bold text-slate-500 font-sans tracking-wide text-sm uppercase mr-2 mt-1 drop-shadow-sm">Team Roster:</span>
          {projectMembers.map((member) => (
            <DraggableAvatar key={member.id} member={member} />
          ))}
          {projectMembers.length === 0 && (
            <span className="text-sm text-slate-400 italic">No members assigned yet...</span>
          )}
        </div>

        {/* COLUMNS SCROLL AREA */}
        <div className="flex flex-1 w-full gap-6 overflow-x-auto p-8 no-scrollbar">
          {columns.map((col) => (
            <Column
              key={col}
              status={col}
              tasks={tasks.filter((t) => t.status === col)}
              currentUserId={currentUserId}
              onAddTask={col === "To Do" ? () => setCreateModalProps({ open: true }) : undefined}
              onDelete={(taskId) => setDeleteModal({ open: true, taskId })}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <TaskItem task={activeTask} currentUserId={currentUserId} />
        ) : null}
        {activeMember ? (
          <div className="w-12 h-12 rounded-full border-2 border-sketchy bg-indigo-100 shadow-sketchy-active opacity-90 scale-110 pointer-events-none overflow-hidden ring-4 ring-indigo-300">
            {activeMember.avatar_url ? (
              <img src={activeMember.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="flex items-center justify-center font-bold text-lg text-indigo-700 w-full h-full">
                {activeMember.display_name[0].toUpperCase()}
              </span>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>

      {/* CREATE TASK Modal */}
      {createModalProps.open && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50">
          <Card className="w-96 p-6">
            <h3 className="text-xl font-bold mb-4">New Task ✏️</h3>
            <p className="mb-4 text-sm text-slate-600">Add a new task to your 'To Do' column.</p>
            <div className="flex flex-col gap-3">
              <Input
                placeholder="Task Title"
                value={createTaskTitle}
                onChange={(e) => setCreateTaskTitle(e.target.value)}
                autoFocus
                className="w-full"
              />
              <textarea 
                placeholder="Description (optional)"
                value={createTaskDesc}
                onChange={(e) => setCreateTaskDesc(e.target.value)}
                className="w-full min-h-[80px] border-sketchy p-2 outline-none focus:ring-2 resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" onClick={() => {
                setCreateModalProps({ open: false });
                setCreateTaskTitle("");
                setCreateTaskDesc("");
              }}>Cancel</Button>
              <Button 
                onClick={async () => {
                  if (!createTaskTitle.trim()) return;
                  const { createTaskAction } = await import("@/app/actions/kanban");
                  
                  setCreateModalProps({ open: false });
                  setCreateTaskTitle("");
                  setCreateTaskDesc("");
                  
                  startTransition(async () => {
                    const res = await createTaskAction(projectId, createTaskTitle, createTaskDesc, currentUserId);
                    if (res?.success && res.task) {
                      // Instantly add the real task from DB to avoid crypto.randomUUID mismatch during DND
                      setTasks((prev) => [...prev, res.task as Task]);
                    }
                  });
                }}
              >
                Create
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* BRANCH URL Modal */}
      {branchModal.open && branchModal.task && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50">
          <Card className="w-96 p-6">
            <h3 className="text-xl font-bold mb-4">Start Work 🚀</h3>
            <p className="mb-4 text-sm text-slate-600">Please provide the GitHub Branch URL for '{branchModal.task.title}'</p>
            <Input
              placeholder="https://github.com/org/repo/tree/branch"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" onClick={() => { setBranchModal({ open: false, task: null }); setUrlInput(""); }}>Cancel</Button>
              <Button onClick={() => {
                if (!validateUrl(urlInput)) {
                  setAlertMessage("Invalid format! Please enter a correct URL starting with http:// or https://");
                  return;
                }
                updateTaskStatus(branchModal.task!.id, "In Progress", { github_branch_url: urlInput });
                setBranchModal({ open: false, task: null });
                setUrlInput("");
              }}>Start</Button>
            </div>
          </Card>
        </div>
      )}

      {/* PR URL Modal */}
      {prModal.open && prModal.task && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50">
          <Card className="w-96 p-6">
            <h3 className="text-xl font-bold mb-4">Submit for Review 👀</h3>
            <p className="mb-4 text-sm text-slate-600">Please provide the GitHub PR URL.</p>
            <Input
              placeholder="https://github.com/org/repo/pull/123"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" onClick={() => { setPrModal({ open: false, task: null }); setUrlInput(""); }}>Cancel</Button>
              <Button onClick={() => {
                if (!validateUrl(urlInput)) {
                  setAlertMessage("Invalid format! Please enter a correct URL starting with http:// or https://");
                  return;
                }
                updateTaskStatus(prModal.task!.id, "Code Review", { github_pr_url: urlInput });
                setPrModal({ open: false, task: null });
                setUrlInput("");
              }}>Submit PR</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Custom Reviewer Selection Modal */}
      {reviewModal.open && reviewModal.task && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50">
          <Card className="w-96 p-6">
            <h3 className="text-xl font-bold mb-4">Request Approval ✅</h3>
            <p className="mb-4 text-sm text-slate-600">Before moving to Done, pick a reviewer.</p>
            <select
              className="w-full border-sketchy p-2 bg-white outline-none focus:ring-2 mb-4"
              value={selectedReviewer}
              onChange={(e) => setSelectedReviewer(e.target.value)}
            >
              <option value="" disabled>Select a team member</option>
              {projectMembers.map(m => (
                <option key={m.id} value={m.id}>{m.display_name}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" onClick={() => setReviewModal({ open: false, task: null })}>Cancel</Button>
              <Button onClick={() => {
                if (!selectedReviewer) return;
                const reviewer = projectMembers.find(m => m.id === selectedReviewer);
                updateTaskStatus(reviewModal.task!.id, reviewModal.task!.status, {
                  is_pending_approval: true,
                  pending_reviewer_id: selectedReviewer,
                  reviewer: reviewer
                });
                setReviewModal({ open: false, task: null });
                setSelectedReviewer("");
              }}>Request</Button>
            </div>
          </Card>
        </div>
      )}

      {/* CUSTOM ALERT Modal */}
      {alertMessage && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[100] animate-in fade-in duration-200">
          <Card className="w-80 p-6 border-red-400 bg-red-50 text-center flex flex-col items-center shadow-[4px_4px_0_#fca5a5]">
            <h3 className="text-2xl font-bold mb-2 text-red-600">Hold up! 🚨</h3>
            <p className="mb-6 text-sm text-red-800 leading-relaxed">{alertMessage}</p>
            <Button variant="danger" onClick={() => setAlertMessage(null)}>
              Got it
            </Button>
          </Card>
        </div>
      )}

      {/* DELETE CONFIRMATION Modal */}
      {deleteModal.open && deleteModal.taskId && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[60] animate-in fade-in duration-200">
          <Card className="w-96 p-6 border-sketchy shadow-[4px_4px_0_#cbd5e1]">
            <h3 className="text-xl font-bold mb-4 text-red-600 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
              Delete Task?
            </h3>
            <p className="mb-6 text-sm text-slate-700 leading-relaxed">
              Are you sure you want to permanently delete this task? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="ghost" onClick={() => setDeleteModal({ open: false, taskId: null })}>Cancel</Button>
              <Button variant="danger" onClick={async () => {
                const targetId = deleteModal.taskId;
                if (!targetId) return;

                // Optimistic UI deletion
                setTasks((prev) => prev.filter((t) => t.id !== targetId));
                setDeleteModal({ open: false, taskId: null });

                // Backend mutation
                const { deleteTaskAction } = await import("@/app/actions/kanban");
                startTransition(() => {
                  deleteTaskAction(targetId);
                });
              }}>Yes, Delete</Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
