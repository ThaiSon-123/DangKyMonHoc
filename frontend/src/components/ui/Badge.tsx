import type { ReactNode } from "react";

type Tone = "neutral" | "accent" | "success" | "warn" | "danger";

interface Props {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}

const TONES: Record<Tone, string> = {
  neutral: "bg-surface text-ink-muted",
  accent: "bg-navy-50 text-navy-600",
  success: "bg-green-100 text-success",
  warn: "bg-amber-100 text-warn",
  danger: "bg-red-100 text-danger",
};

export default function Badge({ tone = "neutral", children, className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11.5px] font-medium leading-snug ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
