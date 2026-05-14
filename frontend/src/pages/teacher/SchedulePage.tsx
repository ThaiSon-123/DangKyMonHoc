import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Modal, ScheduleGrid, Stat, type ScheduleEvent } from "@/components/ui";
import Icon from "@/components/ui/Icon";
import { listClassSections } from "@/api/classes";
import { getMyTeacherProfile } from "@/api/teachers";
import { listSemesters } from "@/api/semesters";
import { extractApiError } from "@/lib/errors";
import {
  WEEKDAY_LABELS,
  type ClassSection,
  type Schedule,
  type Semester,
} from "@/types/domain";

interface EnrichedSchedule extends Schedule {
  course_code: string;
  course_name: string;
  class_section_code: string;
  enrolled_count: number;
  max_students: number;
}

function toDateOnly(value: Date | string): Date {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfWeek(date: Date): Date {
  const next = toDateOnly(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  return next;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function TeacherSchedulePage() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<number | "">("");
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teacherId, setTeacherId] = useState<number | null>(null);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));

  const [selectedEvent, setSelectedEvent] = useState<EnrichedSchedule | null>(null);

  useEffect(() => {
    getMyTeacherProfile()
      .then((t) => setTeacherId(t.id))
      .catch((err) => setError(extractApiError(err, "Không tải được hồ sơ.")));
  }, []);

  useEffect(() => {
    listSemesters({ page_size: 1000 })
      .then((r) => {
        setSemesters(r.results);
        const openSem = r.results.find((s) => s.is_open);
        setSelectedSemester(openSem?.id ?? r.results[0]?.id ?? "");
      })
      .catch((err) => setError(extractApiError(err, "Không tải được học kỳ.")));
  }, []);

  const refresh = useCallback(async () => {
    if (!selectedSemester || !teacherId) return;
    setLoading(true);
    try {
      const data = await listClassSections({
        semester: selectedSemester,
        teacher: teacherId,
        page_size: 1000,
      });
      setClasses(data.results);
    } catch (err) {
      setError(extractApiError(err, "Không tải được lớp."));
    } finally {
      setLoading(false);
    }
  }, [selectedSemester, teacherId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const semester = semesters.find((s) => s.id === selectedSemester);
    if (!semester) return;
    const today = toDateOnly(new Date());
    const semesterStart = toDateOnly(semester.start_date);
    const semesterEnd = toDateOnly(semester.end_date);
    const base = today >= semesterStart && today <= semesterEnd ? today : semesterStart;
    setWeekStart(startOfWeek(base));
  }, [selectedSemester, semesters]);

  const schedules: EnrichedSchedule[] = useMemo(() => {
    const flat: EnrichedSchedule[] = [];
    for (const cs of classes) {
      for (const sch of cs.schedules) {
        flat.push({
          ...sch,
          course_code: cs.course_code,
          course_name: cs.course_name,
          class_section_code: cs.code,
          enrolled_count: cs.enrolled_count,
          max_students: cs.max_students,
        });
      }
    }
    return flat;
  }, [classes]);

  const events: ScheduleEvent[] = useMemo(() => {
    const courseColorMap = new Map<string, number>();
    let idx = 0;
    for (const s of schedules) {
      if (!courseColorMap.has(s.course_code)) {
        courseColorMap.set(s.course_code, idx++);
      }
    }
    return schedules.map((s) => ({
      id: s.id,
      weekday: s.weekday,
      start_period: s.start_period,
      end_period: s.end_period,
      start_date: s.start_date,
      end_date: s.end_date,
      title: s.class_section_code,
      subtitle: s.course_name,
      meta: s.room ? `Phòng ${s.room}` : "",
      colorIndex: courseColorMap.get(s.course_code) ?? 0,
    }));
  }, [schedules]);

  const totalClasses = classes.length;
  const totalSessions = schedules.length;
  const totalStudents = classes.reduce((s, c) => s + c.enrolled_count, 0);
  const periodsPerWeek = schedules.reduce(
    (s, sch) => s + (sch.end_period - sch.start_period + 1),
    0,
  );
  const weekEnd = addDays(weekStart, 6);
  const weekLabel = `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;

  function handleEventClick(e: ScheduleEvent) {
    const sch = schedules.find((s) => s.id === e.id);
    if (sch) setSelectedEvent(sch);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h1 className="m-0 text-[22px] font-semibold tracking-tight text-ink">
            Lịch dạy cá nhân
          </h1>
          <p className="mt-1 text-[13.5px] text-ink-muted">
            TKB giảng dạy của các lớp được phân công. Dùng nút tuần để xem lịch theo từng tuần học.
          </p>
        </div>
        <select
          value={selectedSemester}
          onChange={(e) =>
            setSelectedSemester(e.target.value === "" ? "" : Number(e.target.value))
          }
          className="px-3 py-2 rounded-md bg-card border border-line text-[13px] min-w-[250px]"
        >
          <option value="">- Chọn học kỳ -</option>
          {semesters.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code} - {s.name}
              {s.is_open ? " (đang mở)" : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Lớp phụ trách" value={totalClasses} icon="clipboard" tone="accent" />
        <Stat label="Buổi học / tuần" value={totalSessions} icon="calendar" />
        <Stat label="Tiết / tuần" value={periodsPerWeek} icon="clock" />
        <Stat label="Tổng SV" value={totalStudents} icon="users" />
      </div>

      {error && (
        <div className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <Card
        title="Lịch dạy theo tuần"
        subtitle={`Tuần ${weekLabel} · Click buổi dạy để xem chi tiết`}
        action={
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              icon="chevronLeft"
              onClick={() => setWeekStart((d) => addDays(d, -7))}
              title="Tuần trước"
            />
            <Button size="sm" variant="secondary" onClick={() => setWeekStart(startOfWeek(new Date()))}>
              Hôm nay
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon="chevronRight"
              onClick={() => setWeekStart((d) => addDays(d, 7))}
              title="Tuần sau"
            />
          </div>
        }
      >
        {loading ? (
          <div className="py-10 text-center text-ink-muted">Đang tải...</div>
        ) : events.length === 0 ? (
          <div className="py-10 text-center">
            <div className="w-14 h-14 rounded-xl bg-surface text-ink-faint grid place-items-center mx-auto mb-3">
              <Icon name="calendar" size={28} />
            </div>
            <div className="text-[15px] font-semibold text-ink mb-1">Không có lịch dạy</div>
            <p className="text-[13px] text-ink-muted">
              Bạn chưa được phân công lớp nào trong học kỳ này.
            </p>
          </div>
        ) : (
          <ScheduleGrid events={events} weekStart={weekStart} onEventClick={handleEventClick} />
        )}
      </Card>

      <Modal
        open={selectedEvent !== null}
        title={selectedEvent ? `${selectedEvent.course_code} - ${selectedEvent.course_name}` : ""}
        subtitle={selectedEvent ? `Lớp ${selectedEvent.class_section_code}` : ""}
        onClose={() => setSelectedEvent(null)}
        size="md"
        footer={
          <Button variant="ghost" onClick={() => setSelectedEvent(null)}>
            Đóng
          </Button>
        }
      >
        {selectedEvent && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <InfoItem label="Thứ" value={WEEKDAY_LABELS[selectedEvent.weekday]} />
              <InfoItem
                label="Tiết"
                value={`${selectedEvent.start_period} - ${selectedEvent.end_period}`}
                mono
              />
              <InfoItem
                label="Phòng"
                value={selectedEvent.room || "Chưa thiết lập"}
                mono
              />
              <InfoItem
                label="Sĩ số"
                value={`${selectedEvent.enrolled_count}/${selectedEvent.max_students}`}
                mono
              />
            </div>
            {(selectedEvent.start_date || selectedEvent.end_date) && (
              <div className="bg-surface rounded-md px-3 py-2 text-[12.5px] text-ink-muted">
                <Icon name="calendar" size={13} className="inline mr-1.5" />
                Khoảng ngày: <span className="font-mono">{selectedEvent.start_date ?? "?"}</span>{" "}
                - <span className="font-mono">{selectedEvent.end_date ?? "?"}</span>
              </div>
            )}
            <Badge tone="success">Được phân công</Badge>
          </div>
        )}
      </Modal>
    </div>
  );
}

function InfoItem({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[11.5px] text-ink-muted uppercase tracking-wider font-semibold mb-0.5">
        {label}
      </div>
      <div className={`text-[13.5px] text-ink ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
