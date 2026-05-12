import type { ReactNode } from "react";

interface Props {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export default function Card({
  title,
  subtitle,
  action,
  children,
  className = "",
  bodyClassName = "p-5",
}: Props) {
  return (
    <div
      className={`bg-card rounded-xl border border-line shadow-card overflow-hidden ${className}`}
    >
      {(title || action) && (
        <div className="px-5 py-3.5 border-b border-line flex items-center gap-3">
          <div className="flex-1 min-w-0">
            {title && <div className="text-sm font-semibold text-ink">{title}</div>}
            {subtitle && (
              <div className="text-[12.5px] text-ink-muted mt-0.5">{subtitle}</div>
            )}
          </div>
          {action}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
