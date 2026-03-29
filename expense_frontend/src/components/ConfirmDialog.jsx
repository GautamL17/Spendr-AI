import React, { useEffect } from "react";
import { createPortal } from "react-dom";

export default function ConfirmDialog({
  open,
  title = "are you sure?",
  message = "this action cannot be undone.",
  confirmLabel = "delete",
  onConfirm,
  onCancel,
  danger = true,
}) {
  // Lock body scroll while open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onCancel?.(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  // Semantic Logic for Danger (Red) vs Warning (Amber)
  const accentClasses = danger 
    ? "bg-red-500/10 border-red-500/30 text-red-400" 
    : "bg-amber-500/10 border-amber-500/30 text-amber-400";

  const glowGradient = danger
    ? "bg-[radial-gradient(circle,_rgba(248,113,113,0.12)_0%,_transparent_70%)]"
    : "bg-[radial-gradient(circle,_rgba(251,191,36,0.1)_0%,_transparent_70%)]";

  // The Actual JSX
  const dialogContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md transition-opacity">
      <style>{`
        @keyframes dialogFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes dialogSlideUp { 
          from { opacity: 0; transform: translateY(20px) scale(0.95); } 
          to { opacity: 1; transform: translateY(0) scale(1); } 
        }
      `}</style>

      {/* Backdrop area for closing */}
      <div className="absolute inset-0" onClick={onCancel} />

      {/* Card Body */}
      <div
        className={`relative w-full max-w-[400px] rounded-[32px] p-8 overflow-hidden bg-sp-surface border shadow-[0_32px_80px_rgba(0,0,0,0.6)] backdrop-blur-md ${
          danger ? "border-red-500/20" : "border-amber-500/20"
        }`}
        style={{ 
          animation: "dialogSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) both",
          background: "var(--color-sp-surface2)" 
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Corner Glow */}
        <div className={`absolute -top-12 -right-12 w-40 h-40 rounded-full pointer-events-none opacity-60 ${glowGradient}`} />

        {/* Dynamic Icon */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-5 border ${accentClasses}`}>
          {danger ? "🗑" : "⚠️"}
        </div>

        {/* Header & Body */}
        <h3 className="font-display font-bold text-xl text-sp-text mb-2 tracking-tight">
          {title}
        </h3>
        <p className="font-body text-sm text-sp-muted leading-relaxed mb-8">
          {message}
        </p>

        {/* Action Row */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl font-body font-bold text-sm text-sp-muted border border-sp-border bg-transparent cursor-pointer transition-all hover:text-sp-text hover:bg-sp-surface"
          >
            cancel
          </button>

          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-2xl font-display font-extrabold text-sm cursor-pointer transition-all border hover:brightness-125 ${accentClasses}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  // Teleport to the end of <body> so it's always on top of everything
  return createPortal(dialogContent, document.body);
}