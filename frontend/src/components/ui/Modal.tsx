import { useEffect, type ReactNode } from "react";
import Icon from "./Icon";

interface Props {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const SIZE_CLASS = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-6xl",
};

export default function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  size = "md",
}: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`bg-card rounded-xl border border-line shadow-elevated w-full ${SIZE_CLASS[size]} max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3.5 border-b border-line flex items-start gap-3 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-semibold text-ink">{title}</div>
            {subtitle && <div className="text-[12.5px] text-ink-muted mt-0.5">{subtitle}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-md text-ink-muted hover:bg-surface grid place-items-center -mt-1 -mr-1"
            aria-label="Đóng"
          >
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto overscroll-contain">{children}</div>
        {footer && (
          <div className="px-5 py-3 border-t border-line bg-cardAlt flex justify-end gap-2 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
