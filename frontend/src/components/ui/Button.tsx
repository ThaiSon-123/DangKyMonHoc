import type { ButtonHTMLAttributes, ReactNode } from "react";
import Icon, { type IconName } from "./Icon";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "soft";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconRight?: IconName;
  children?: ReactNode;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary:
    "bg-navy-600 text-white border border-navy-600 hover:bg-navy-700 hover:border-navy-700",
  secondary:
    "bg-white text-ink border border-line hover:bg-cardAlt",
  ghost: "bg-transparent text-ink-muted border border-transparent hover:bg-surface",
  danger:
    "bg-transparent text-danger border border-line hover:bg-red-50",
  soft:
    "bg-navy-50 text-navy-600 border border-transparent hover:bg-navy-100",
};

const SIZE_CLASS: Record<Size, string> = {
  sm: "px-2.5 py-1 text-[12.5px]",
  md: "px-3 py-1.5 text-[13px]",
  lg: "px-4 py-2.5 text-sm",
};

export default function Button({
  variant = "secondary",
  size = "md",
  icon,
  iconRight,
  children,
  className = "",
  ...rest
}: Props) {
  const iconSize = size === "sm" ? 13 : 15;
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${className}`}
      {...rest}
    >
      {icon && <Icon name={icon} size={iconSize} />}
      {children}
      {iconRight && <Icon name={iconRight} size={iconSize} />}
    </button>
  );
}
