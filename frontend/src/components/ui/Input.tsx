import type { InputHTMLAttributes, ReactNode } from "react";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  hint?: string;
}

export default function Input({
  label,
  leading,
  trailing,
  hint,
  className = "",
  ...rest
}: Props) {
  return (
    <label className="block">
      {label && (
        <div className="text-[12.5px] font-medium text-ink mb-1.5">{label}</div>
      )}
      <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-card border border-line focus-within:border-navy-400 focus-within:ring-2 focus-within:ring-navy-50 transition-colors">
        {leading && <span className="text-ink-faint">{leading}</span>}
        <input
          className={`flex-1 bg-transparent outline-none text-[13px] text-ink placeholder:text-ink-faint min-w-0 ${className}`}
          {...rest}
        />
        {trailing && <span className="text-ink-faint">{trailing}</span>}
      </div>
      {hint && <div className="text-[11.5px] text-ink-faint mt-1">{hint}</div>}
    </label>
  );
}
