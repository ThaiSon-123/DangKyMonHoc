import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Modal, ScheduleGrid, Stat, type ScheduleEvent } from "@/components/ui";
import Icon from "@/components/ui/Icon";
import { listClassSections } from "@/api/classes";
import { getMyTeacherProfile } from "@/api/teachers";
import { listSemesters } from "@/api/semesters";
import { extractApiError } from "@/lib/errors";
import { showErrorToast } from "@/lib/toast";
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

function parseDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(value: Date): string {
  return value.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function addDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(value: Date): Date {
  const next = new Date(value);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function sameDateOrBefore(left: Date, right: Date): boolean {
  return left.getTime() <= right.getTime();
}

export default function TeacherSchedulePage() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<number | "">("");
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState<number | null>(null);

  const [selectedEvent, setSelectedEvent] = useState<EnrichedSchedule | null>(null);
  const [weekStart, setWeekStart] = useState<Date | null>(null);

  // 1. Load teacher profile + semesters
  useEffect(() => {
    getMyTeacherProfile()
      .then((t) => setTeacherId(t.id))
      .catch((err) => showErrorToast(extractApiError(err, "Không tải được hồ sơ giáo viên.")));
  }, []);

  useEffect(() => {
    listSemesters({ page_size: 1000 })
      .then((r) => {
        setSemesters(r.results);
        const openSem = r.results.find((s) => s.is_open);
        const initial = openSem ?? r.results[0];
        setSelectedSemester(initial?.id ?? "");
        if (initial) setWeekStart(startOfWeek(parseDate(initial.start_date)));
      })
      .catch((err) => showErrorToast(extractApiError(err, "Không tải được danh sách học kỳ.")));
  }, []);

  // 2. Khi semester/teacher thay đổi: load class sections
  const loadSchedule = useCallback(async () => {
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
      showErrorToast(extractApiError(err, "Không tải được danh sách lớp."));
    } finally {
      setLoading(false);
    }
  }, [selectedSemester, teacherId]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // Flatten schedules
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

  const semesterObj = semesters.find((s) => s.id === selectedSemester);
  const semesterStart = semesterObj ? parseDate(semesterObj.start_date) : null;
  const semesterEnd = semesterObj ? parseDate(semesterObj.end_date) : null;
  const weekEnd = weekStart ? addDays(weekStart, 6) : null;

  // Filter schedules trong tuần đang xem (theo start_date/end_date của schedule)
  const visibleSchedules = useMemo(() => {
    if (!semesterObj || !weekStart || !weekEnd) return schedules;
    return schedules.filter((s) => {
      const scheduleStart = s.start_date ? parseDate(s.start_date) : parseDate(semesterObj.start_date);
      const scheduleEnd = s.end_date ? parseDate(s.end_date) : parseDate(semesterObj.end_date);
      return sameDateOrBefore(scheduleStart, weekEnd) && sameDateOrBefore(weekStart, scheduleEnd);
    });
  }, [schedules, semesterObj, weekStart, weekEnd]);

  // Convert → ScheduleEvent, colorIndex theo course
  const events: ScheduleEvent[] = useMemo(() => {
    const courseColorMap = new Map<string, number>();
    let nextIdx = 0;
    for (const s of visibleSchedules) {
      if (!courseColorMap.has(s.course_code)) {
        courseColorMap.set(s.course_code, nextIdx++);
      }
    }
    return visibleSchedules.map((s) => ({
      id: s.id,
      weekday: s.weekday,
      start_period: s.start_period,
      end_period: s.end_period,
      title: s.class_section_code,
      subtitle: s.course_name,
      meta: s.room ? `Phòng ${s.room}` : "",
      colorIndex: courseColorMap.get(s.course_code) ?? 0,
    }));
  }, [visibleSchedules]);

  // KPIs — tính theo tuần đang hiển thị (visibleSchedules), không phải toàn HK
  const totalClasses = classes.length;
  const sessionsThisWeek = visibleSchedules.length;
  const periodsThisWeek = visibleSchedules.reduce(
    (s, sch) => s + (sch.end_period - sch.start_period + 1),
    0,
  );

  function handleEventClick(event: ScheduleEvent) {
    const sch = visibleSchedules.find((s) => s.id === event.id);
    if (sch) setSelectedEvent(sch);
  }

  function handleSemesterChange(value: number | "") {
    setSelectedSemester(value);
    const semester = semesters.find((s) => s.id === value);
    setWeekStart(semester ? startOfWeek(parseDate(semester.start_date)) : null);
  }

  function moveWeek(delta: number) {
    if (!weekStart || !semesterStart || !semesterEnd) return;
    const next = addDays(weekStart, delta * 7);
    const minWeek = startOfWeek(semesterStart);
    const maxWeek = startOfWeek(semesterEnd);
    if (next < minWeek || next > maxWeek) return;
    setWeekStart(next);
  }

  const canGoPrev = !!weekStart && !!semesterStart && weekStart > startOfWeek(semesterStart);
  const canGoNext = !!weekStart && !!semesterEnd && weekStart < startOfWeek(semesterEnd);

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h1 className="m-0 text-[22px] font-semibold tracking-tight text-ink">
            Thời khóa biểu
          </h1>
        </div>
        <select
          value={selectedSemester}
          onChange={(e) => handleSemesterChange(e.target.value === "" ? "" : Number(e.target.value))}
          className="px-3 py-2 rounded-md bg-card border border-line text-[13px] min-w-[250px]"
        >
          <option value="">— Chọn học kỳ —</option>
          {semesters.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code} - {s.name}
              {s.is_open ? " (đang mở)" : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Lớp phụ trách" value={totalClasses} icon="clipboard" tone="accent" />
        <Stat
          label="Buổi dạy / tuần"
          value={sessionsThisWeek}
          hint="trong tuần đang xem"
          icon="calendar"
        />
        <Stat
          label="Tiết / tuần"
          value={periodsThisWeek}
          hint="trong tuần đang xem"
          icon="clock"
        />
      </div>

      <Card
        title="Lịch dạy theo tuần"
        subtitle={
          weekStart && weekEnd
            ? `Tuần ${formatDate(weekStart)} - ${formatDate(weekEnd)}`
            : "Click vào buổi dạy để xem chi tiết"
        }
      >
        <div className="flex items-center justify-end gap-2 mb-3">
          <Button variant="ghost" icon="chevronLeft" onClick={() => moveWeek(-1)} disabled={!canGoPrev}>
            Tuần trước
          </Button>
          <Button variant="ghost" iconRight="chevronRight" onClick={() => moveWeek(1)} disabled={!canGoNext}>
            Tuần sau
          </Button>
        </div>
        {loading ? (
          <div className="py-10 text-center text-ink-muted">Đang tải TKB...</div>
        ) : !selectedSemester ? (
          <div className="py-10 text-center text-ink-faint">
            Chọn học kỳ ở góc trên phải để xem TKB.
          </div>
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
          <ScheduleGrid events={events} onEventClick={handleEventClick} />
        )}
      </Card>

      {/* Danh sách lớp giảng dạy */}
      {classes.length > 0 && (
        <Card
          title="Danh sách lớp giảng dạy"
          subtitle={`${classes.length} lớp`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {classes.map((c) => (
              <div
                key={c.id}
                className="border border-line rounded-md p-3 flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-md bg-navy-50 text-navy-600 grid place-items-center flex-shrink-0 font-mono text-[11px] font-semibold">
                  {c.enrolled_count}/{c.max_students}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-mono text-[12px] text-ink-muted">
                      {c.course_code}
                    </span>
                    <span className="text-ink-faint">·</span>
                    <span className="font-mono text-[12px] text-ink-muted">
                      {c.code}
                    </span>
                  </div>
                  <div className="text-[13px] font-medium text-ink truncate">
                    {c.course_name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modal chi tiết buổi dạy */}
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
                value={`${selectedEvent.start_period} – ${selectedEvent.end_period}`}
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
                → <span className="font-mono">{selectedEvent.end_date ?? "?"}</span>
              </div>
            )}
            <div className="pt-2 border-t border-line">
              <Badge tone="accent">Được phân công</Badge>
            </div>
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
