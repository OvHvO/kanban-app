"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import type { Profile } from "@/types/kanban";

interface ChairSeatProps {
  index: number;
  occupant: Profile | null;
  currentUserId: string;
}

function ChairSeat({ index, occupant, currentUserId }: ChairSeatProps) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `rest-seat-${index}`,
    data: { type: "RestSeat", seatIndex: index },
  });

  // Only allow dragging if the current user IS the occupant
  const canDrag = occupant !== null && occupant.id === currentUserId;

  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: `resting-member-${index}`,
    data: { type: "RestingMember", member: occupant, seatIndex: index },
    disabled: !canDrag,
  });

  // Merge refs
  const mergedRef = (el: HTMLDivElement | null) => {
    setDropRef(el);
    setDragRef(el);
  };

  return (
    <div
      ref={mergedRef}
      {...(canDrag ? { ...listeners, ...attributes } : {})}
      className={`relative flex flex-col items-center gap-1 transition-all duration-200`}
    >
      {/* Seat visual */}
      <div
        className={`relative w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 ${
          occupant
            ? isDragging
              ? "opacity-30 scale-95 border-slate-300 bg-slate-50"
              : canDrag
                ? "border-emerald-400 bg-emerald-50/60 cursor-grab shadow-[2px_2px_0_#a7f3d0] hover:-translate-y-0.5"
                : "border-amber-300 bg-amber-50/40 shadow-[2px_2px_0_#fde68a]"
            : isOver
              ? "border-emerald-400 bg-emerald-50/80 scale-105 border-dashed shadow-[0_0_12px_rgba(52,211,153,0.3)]"
              : "border-slate-200 bg-white/60 border-dashed hover:border-slate-300"
        }`}
        style={{ borderRadius: "15px 225px 15px 255px/255px 15px 225px 15px" }}
      >
        {occupant ? (
          <>
            {/* The avatar */}
            <div className={`w-11 h-11 rounded-full overflow-hidden ${occupant.color || "bg-indigo-100"}`}>
              {occupant.avatar_url ? (
                <img
                  src={occupant.avatar_url}
                  alt={occupant.display_name}
                  className="w-full h-full object-cover pointer-events-none"
                />
              ) : (
                <span className="flex items-center justify-center w-full h-full font-bold text-lg select-none text-indigo-700 pointer-events-none">
                  {occupant.display_name?.[0]?.toUpperCase() || "?"}
                </span>
              )}
            </div>
            {/* Lock icon if NOT the current user */}
            {!canDrag && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 border border-amber-600 flex items-center justify-center shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
            )}
            {/* Zzz animation */}
            <div className="absolute -top-3 -right-2 text-xs font-bold text-slate-400 animate-bounce select-none pointer-events-none" style={{ animationDuration: "2s" }}>
              💤
            </div>
          </>
        ) : (
          /* Empty chair icon */
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isOver ? "#059669" : "#94a3b8"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-colors">
            <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
            <path d="M3 16h18" />
            <path d="M5 16v4" />
            <path d="M19 16v4" />
            <path d="M3 11a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5H3v-5Z" />
          </svg>
        )}
      </div>

      {/* Name tag */}
      {occupant && (
        <span className="text-[9px] font-bold text-slate-500 truncate max-w-[60px] text-center leading-none">
          {occupant.display_name}
        </span>
      )}
    </div>
  );
}

// ---

interface RestAreaProps {
  seats: (Profile | null)[];
  currentUserId: string;
}

export function RestArea({ seats, currentUserId }: RestAreaProps) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 border-2 border-slate-200 bg-gradient-to-r from-white to-slate-50/80 rounded-xl shrink-0"
      style={{ borderRadius: "255px 15px 225px 15px/15px 225px 15px 255px" }}
    >
      {/* Header */}
      <div className="flex flex-col items-center gap-0.5 mr-1">
        <span className="text-lg select-none">☕</span>
        <span className="font-bold text-slate-500 font-sans tracking-wide text-[10px] uppercase">
          Break
        </span>
      </div>

      {/* 5 Chair Seats in a row */}
      <div className="flex gap-2.5">
        {seats.map((occupant, i) => (
          <ChairSeat
            key={i}
            index={i}
            occupant={occupant}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </div>
  );
}
