import Icon, { type IconName } from "./Icon";

interface Props {
  label: string;
  value: string | number;
  delta?: string;
  hint?: string;
  icon?: IconName;
  tone?: "neutral" | "accent";
}

export default function Stat({ label, value, delta, hint, icon, tone = "neutral" }: Props) {
  const deltaIsNegative = delta?.startsWith("-");
  return (
    <div className="bg-card rounded-xl border border-line p-5 flex flex-col gap-2 shadow-card">
      <div className="flex items-center gap-2">
        {icon && (
          <div
            className={`w-8 h-8 rounded-md grid place-items-center ${
              tone === "accent"
                ? "bg-navy-50 text-navy-600"
                : "bg-surface text-ink-muted"
            }`}
          >
            <Icon name={icon} size={16} />
          </div>
        )}
        <span className="text-[12.5px] text-ink-muted font-medium">{label}</span>
      </div>
      <div className="text-[26px] font-semibold leading-none tracking-tight">
        {value}
      </div>
      <div className="flex items-center gap-1.5 text-[11.5px]">
        {delta && (
          <span
            className={`font-semibold ${
              deltaIsNegative ? "text-danger" : "text-success"
            }`}
          >
            {delta}
          </span>
        )}
        {hint && <span className="text-ink-faint">{hint}</span>}
      </div>
    </div>
  );
}
