import { useMemo } from "react";
import { WEEKDAY_LABELS, type Weekday } from "@/types/domain";

export interface ScheduleEvent {
  id: string | number;
  weekday: Weekday;
  start_period: number;
  end_period: number;
  /** Dòng 1 hiển thị (vd. mã môn / mã lớp) */
  title: string;
  /** Dòng 2 hiển thị (vd. tên môn) */
  subtitle?: string;
  /** Dòng 3 hiển thị (vd. phòng / GV) */
  meta?: string;
  /** Index để chọn màu (cùng index = cùng màu) */
  colorIndex?: number;
}

interface Props {
  events: ScheduleEvent[];
  /** Có hiện ngày Chủ nhật không (default true) */
  showSunday?: boolean;
  /** Bấm vào event sẽ gọi callback */
  onEventClick?: (event: ScheduleEvent) => void;
}

const PERIODS = Array.from({ length: 15 }, (_, i) => i + 1);

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

export default function ScheduleGrid({ events, showSunday = true, onEventClick }: Props) {
  const weekdays: Weekday[] = showSunday ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4, 5];

  // Map: weekday -> period -> event (chỉ đặt ở start_period, các tiết sau là "đã occupied")
  const eventMap = useMemo(() => {
    const map = new Map<string, ScheduleEvent>();
    for (const e of events) {
      map.set(`${e.weekday}-${e.start_period}`, e);
    }
    return map;
  }, [events]);

  // Set tiết bị occupy bởi event multi-period
  const occupied = useMemo(() => {
    const set = new Set<string>();
    for (const e of events) {
      for (let p = e.start_period + 1; p <= e.end_period; p++) {
        set.add(`${e.weekday}-${p}`);
      }
    }
    return set;
  }, [events]);

  return (
    <div className="overflow-x-auto">
      <div
        className="grid gap-0 min-w-[800px] border border-line rounded-lg overflow-hidden"
        style={{
          gridTemplateColumns: `60px repeat(${weekdays.length}, minmax(100px, 1fr))`,
        }}
      >
        {/* Header row: empty cell + weekday labels */}
        <div className="bg-cardAlt border-b border-r border-line p-2 text-[11px] font-semibold text-ink-muted">
          Tiết
        </div>
        {weekdays.map((wd) => (
          <div
            key={`h-${wd}`}
            className="bg-cardAlt border-b border-r border-line p-2 text-[12.5px] font-semibold text-ink text-center"
          >
            {WEEKDAY_LABELS[wd]}
          </div>
        ))}

        {/* Body: 15 rows × N cols */}
        {PERIODS.map((period) => {
          const isSessionBoundary = period === 6 || period === 11;
          return (
            <div key={`row-${period}`} className="contents">
              {/* Period label */}
              <div
                className={`bg-cardAlt border-r border-line p-2 text-center ${
                  isSessionBoundary ? "border-t-2 border-t-line-strong" : "border-t border-line"
                }`}
              >
                <div className="text-[11px] font-semibold text-ink">{period}</div>
                <div className="text-[9px] text-ink-faint">{getSessionLabel(period)}</div>
              </div>
              {/* Cells */}
              {weekdays.map((wd) => {
                const key = `${wd}-${period}`;
                const event = eventMap.get(key);
                const isOccupied = occupied.has(key);

                if (isOccupied) {
                  // Cell bị event ở tiết trước "đè lên" — render trống
                  return <div key={`c-${key}`} className="" />;
                }

                if (event) {
                  const span = event.end_period - event.start_period + 1;
                  const color = COLORS[(event.colorIndex ?? 0) % COLORS.length];
                  return (
                    <button
                      key={`c-${key}`}
                      type="button"
                      onClick={() => onEventClick?.(event)}
                      className={`text-left border-l-[3px] border-r border-line p-1.5 hover:brightness-95 transition-all ${color} ${
                        isSessionBoundary ? "border-t-2 border-t-line-strong" : "border-t border-line"
                      }`}
                      style={{ gridRow: `span ${span}` }}
                      title={`${event.title}${event.subtitle ? " - " + event.subtitle : ""}`}
                    >
                      <div className="text-[11px] font-mono font-semibold leading-tight truncate">
                        {event.title}
                      </div>
                      {event.subtitle && (
                        <div className="text-[10.5px] font-medium leading-tight mt-0.5 line-clamp-2">
                          {event.subtitle}
                        </div>
                      )}
                      {event.meta && (
                        <div className="text-[9.5px] opacity-70 mt-0.5 line-clamp-1">
                          {event.meta}
                        </div>
                      )}
                    </button>
                  );
                }

                return (
                  <div
                    key={`c-${key}`}
                    className={`border-r border-line bg-card ${
                      isSessionBoundary ? "border-t-2 border-t-line-strong" : "border-t border-line"
                    }`}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-4 text-[11.5px] text-ink-muted">
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
