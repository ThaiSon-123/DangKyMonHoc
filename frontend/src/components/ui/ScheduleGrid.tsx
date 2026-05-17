import { useMemo } from "react";
import { WEEKDAY_LABELS, type Weekday } from "@/types/domain";

export interface ScheduleEvent {
  id: string | number;
  weekday: Weekday;
  start_period: number;
  end_period: number;
  start_date?: string | null;
  end_date?: string | null;
  title: string;
  subtitle?: string;
  meta?: string;
  colorIndex?: number;
}

interface Props {
  events: ScheduleEvent[];
  weekStart?: Date | string;
  showSunday?: boolean;
  onEventClick?: (event: ScheduleEvent) => void;
}

const PERIODS = Array.from({ length: 15 }, (_, i) => i + 1);
const ROW_HEIGHT = 48;

const COLORS = [
  "bg-navy-50 border-l-navy-600 text-navy-900",
  "bg-emerald-50 border-l-emerald-600 text-emerald-900",
  "bg-amber-50 border-l-amber-600 text-amber-900",
  "bg-rose-50 border-l-rose-600 text-rose-900",
  "bg-violet-50 border-l-violet-600 text-violet-900",
  "bg-sky-50 border-l-sky-600 text-sky-900",
  "bg-lime-50 border-l-lime-600 text-lime-900",
  "bg-orange-50 border-l-orange-600 text-orange-900",
];

const SESSION_LABELS = [
  { range: [1, 5] as const, label: "Sáng" },
  { range: [6, 10] as const, label: "Chiều" },
  { range: [11, 15] as const, label: "Tối" },
];

function getSessionLabel(period: number): string {
  for (const s of SESSION_LABELS) {
    if (period >= s.range[0] && period <= s.range[1]) return s.label;
  }
  return "";
}

function toDateOnly(value: Date | string): Date {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDay(date: Date): string {
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate()
  );
}

function isEventActiveInWeek(event: ScheduleEvent, dayInWeek?: Date): boolean {
  if (!dayInWeek) return true;
  const start = event.start_date ? toDateOnly(event.start_date) : null;
  const end = event.end_date ? toDateOnly(event.end_date) : null;
  if (start && dayInWeek < start) return false;
  if (end && dayInWeek > end) return false;
  return true;
}

export default function ScheduleGrid({
  events,
  weekStart,
  showSunday = true,
  onEventClick,
}: Props) {
  const weekdays: Weekday[] = showSunday ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4, 5];
  const weekStartDate = weekStart ? toDateOnly(weekStart) : null;
  const today = toDateOnly(new Date());

  const dayMap = useMemo(() => {
    if (!weekStartDate) return new Map<Weekday, Date>();
    return new Map(weekdays.map((wd) => [wd, addDays(weekStartDate, wd)]));
  }, [weekStartDate?.getTime(), weekdays.join(",")]);

  const eventsByWeekday = useMemo(() => {
    const map = new Map<Weekday, ScheduleEvent[]>();
    for (const wd of weekdays) map.set(wd, []);
    for (const event of events) {
      const day = dayMap.get(event.weekday);
      if (!isEventActiveInWeek(event, day)) continue;
      map.get(event.weekday)?.push(event);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.start_period - b.start_period);
    }
    return map;
  }, [events, dayMap, weekdays.join(",")]);

  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-[980px] overflow-hidden rounded-lg border border-line bg-card"
        style={{
          gridTemplateColumns: `72px repeat(${weekdays.length}, minmax(128px, 1fr))`,
        }}
      >
        <div className="sticky left-0 z-20 bg-cardAlt border-b border-r border-line px-3 py-2 text-[11px] font-semibold text-ink-muted">
          Tiết
        </div>
        {weekdays.map((wd) => {
          const day = dayMap.get(wd);
          const isToday = day ? isSameDay(day, today) : false;
          return (
            <div
              key={`h-${wd}`}
              className={`border-b border-r border-line px-3 py-2 text-center ${
                isToday ? "bg-navy-50" : "bg-cardAlt"
              }`}
            >
              <div className="text-[12.5px] font-semibold text-ink">{WEEKDAY_LABELS[wd]}</div>
              {day && (
                <div
                  className={`mt-0.5 text-[11px] ${
                    isToday ? "font-semibold text-navy-700" : "text-ink-muted"
                  }`}
                >
                  {formatDay(day)}
                </div>
              )}
            </div>
          );
        })}

        <div
          className="sticky left-0 z-10 bg-cardAlt border-r border-line"
          style={{ height: PERIODS.length * ROW_HEIGHT }}
        >
          {PERIODS.map((period) => {
            const isSessionBoundary = period === 6 || period === 11;
            return (
              <div
                key={period}
                className={`flex h-12 flex-col items-center justify-center ${
                  isSessionBoundary ? "border-t-2 border-t-line-strong" : "border-t border-line"
                }`}
              >
                <div className="text-[12px] font-semibold leading-none text-ink">{period}</div>
                <div className="mt-1 text-[9.5px] leading-none text-ink-faint">
                  {getSessionLabel(period)}
                </div>
              </div>
            );
          })}
        </div>

        {weekdays.map((wd) => (
          <div
            key={`day-${wd}`}
            className="relative border-r border-line"
            style={{
              height: PERIODS.length * ROW_HEIGHT,
              backgroundImage:
                "linear-gradient(to bottom, transparent 47px, #e1e7ef 47px)",
              backgroundSize: `100% ${ROW_HEIGHT}px`,
            }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-[240px] border-t-2 border-line-strong" />
            <div className="pointer-events-none absolute inset-x-0 top-[480px] border-t-2 border-line-strong" />
            {(eventsByWeekday.get(wd) ?? []).map((event) => {
              const span = event.end_period - event.start_period + 1;
              const color = COLORS[(event.colorIndex ?? 0) % COLORS.length];
              return (
                <button
                  key={`${event.id}-${event.start_period}`}
                  type="button"
                  onClick={() => onEventClick?.(event)}
                  className={`absolute left-1.5 right-1.5 rounded-md border border-line border-l-[4px] p-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${color}`}
                  style={{
                    top: (event.start_period - 1) * ROW_HEIGHT + 4,
                    height: span * ROW_HEIGHT - 8,
                  }}
                  title={`${event.title}${event.subtitle ? " - " + event.subtitle : ""}`}
                >
                  <div className="truncate font-mono text-[11px] font-semibold leading-tight">
                    {event.title}
                  </div>
                  {event.subtitle && (
                    <div className="mt-1 line-clamp-2 text-[11px] font-medium leading-tight">
                      {event.subtitle}
                    </div>
                  )}
                  {event.meta && (
                    <div className="mt-1 line-clamp-1 text-[10px] opacity-70">
                      {event.meta}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11.5px] text-ink-muted">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-navy-50 border-l-[3px] border-navy-600" />
          <span>Buổi học</span>
        </div>
        <span>·</span>
        <span>Sáng: tiết 1-5</span>
        <span>·</span>
        <span>Chiều: tiết 6-10</span>
        <span>·</span>
        <span>Tối: tiết 11-15</span>
      </div>
    </div>
  );
}
