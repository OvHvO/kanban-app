import React from "react";
import { useDraggable } from "@dnd-kit/core";
import type { Profile } from "@/types/kanban";

interface DraggableAvatarProps {
  member: Profile;
  onClick?: () => void;
}

export function DraggableAvatar({ member, onClick }: DraggableAvatarProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `member-${member.id}`,
    data: { type: "Member", member },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 border-sketchy ${member.color || "bg-indigo-100"} cursor-grab transform transition-all ${
        isDragging ? "opacity-30 scale-110 z-50 ring-4 ring-indigo-300" : "hover:-translate-y-1 shadow-sketchy hover:shadow-[2px_2px_0_#cbd5e1]"
      }`}
      title={`Assign to ${member.display_name}`}
    >
      <div className="w-full h-full rounded-full p-1 overflow-hidden pointer-events-none">
        {member.avatar_url ? (
          <img
            src={member.avatar_url}
            alt={member.display_name}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <span className="flex items-center justify-center w-full h-full font-bold text-lg select-none text-indigo-700">
            {member.display_name ? member.display_name[0].toUpperCase() : "?"}
          </span>
        )}
      </div>
    </div>
  );
}
