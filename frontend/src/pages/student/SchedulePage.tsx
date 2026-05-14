import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Modal, ScheduleGrid, Stat, type ScheduleEvent } from "@/components/ui";
import Icon from "@/components/ui/Icon";
import { listRegistrations, type Registration } from "@/api/registrations";
import { getClassSection } from "@/api/classes";
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
  teacher_name?: string | null;
  registration_id: number;
}

export default function StudentSchedulePage() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<number | "">("");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [schedules, setSchedules] = useState<EnrichedSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedEvent, setSelectedEvent] = useState<EnrichedSchedule | null>(null);

  // 1. Load semesters
  useEffect(() => {
    listSemesters({ page_size: 1000 })
      .then((r) => {
        setSemesters(r.results);
        // Default: học kỳ đang mở, hoặc mới nhất
        const openSem = r.results.find((s) => s.is_open);
        setSelectedSemester(openSem?.id ?? r.results[0]?.id ?? "");
      })
      .catch((err) => setError(extractApiError(err, "Không tải được học kỳ.")));
  }, []);

  // 2. Khi semester thay đổi: load registrations + enrich với schedules
  const loadSchedule = useCallback(async () => {
    if (!selectedSemester) return;
    setLoading(true);
    setError(null);
    try {
      const regsData = await listRegistrations({
        semester: selectedSemester,
        status: "CONFIRMED",
        page_size: 1000,
      });
      setRegistrations(regsData.results);

      // Fetch class section detail của từng reg để có schedules
      const classSections = await Promise.all(
        regsData.results.map((r) => getClassSection(r.class_section)),
      );

      // Flatten schedules + attach course info
      const flat: EnrichedSchedule[] = [];
      regsData.results.forEach((reg, idx) => {
        const cs: ClassSection = classSections[idx];
        for (const sch of cs.schedules) {
          flat.push({
            ...sch,
            course_code: cs.course_code,
            course_name: cs.course_name,
            class_section_code: cs.code,
            teacher_name: cs.teacher_name,
            registration_id: reg.id,
          });
        }
      });
      setSchedules(flat);
    } catch (err) {
      setError(extractApiError(err, "Không tải được TKB."));
    } finally {
      setLoading(false);
    }
  }, [selectedSemester]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // Convert schedules → ScheduleEvent với colorIndex theo course
  const events: ScheduleEvent[] = useMemo(() => {
    // Map course_code → color index (stable)
    const courseColorMap = new Map<string, number>();
    let nextIdx = 0;
    for (const s of schedules) {
      if (!courseColorMap.has(s.course_code)) {
        courseColorMap.set(s.course_code, nextIdx++);
      }
    }

    return schedules.map((s) => ({
      id: s.id,
      weekday: s.weekday,
      start_period: s.start_period,
      end_period: s.end_period,
      title: s.class_section_code,
      subtitle: s.course_name,
      meta: s.room ? `Phòng ${s.room}` : "",
      colorIndex: courseColorMap.get(s.course_code) ?? 0,
    }));
  }, [schedules]);

  const totalCredits = registrations.reduce((s, r) => s + r.course_credits, 0);
  const totalSessions = schedules.length;
  const uniqueCourses = new Set(schedules.map((s) => s.course_code)).size;

  function handleEventClick(event: ScheduleEvent) {
    const sch = schedules.find((s) => s.id === event.id);
    if (sch) setSelectedEvent(sch);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h1 className="m-0 text-[22px] font-semibold tracking-tight text-ink">
            Thời khóa biểu
          </h1>
          <p className="mt-1 text-[13.5px] text-ink-muted">
            Lịch học của các môn đã đăng ký trong học kỳ. 15 tiết/ngày: sáng 1-5 · chiều 6-10 ·
            tối 11-15 (BR-010).
          </p>
        </div>
        <select
          value={selectedSemester}
          onChange={(e) =>
            setSelectedSemester(e.target.value === "" ? "" : Number(e.target.value))
          }
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Môn học" value={uniqueCourses} icon="book" tone="accent" />
        <Stat label="Buổi học / tuần" value={totalSessions} icon="calendar" />
        <Stat label="Tổng tín chỉ" value={totalCredits} icon="layers" />
        <Stat label="Đã đăng ký" value={registrations.length} icon="check" />
      </div>

      {error && (
        <div className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <Card title="Lịch học theo tuần" subtitle="Click vào buổi học để xem chi tiết">
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
            <div className="text-[15px] font-semibold text-ink mb-1">TKB trống</div>
            <p className="text-[13px] text-ink-muted">
              Bạn chưa đăng ký môn nào trong học kỳ này, hoặc các môn đã đăng ký chưa có lịch học.
            </p>
          </div>
        ) : (
          <ScheduleGrid events={events} onEventClick={handleEventClick} />
        )}
      </Card>

      {/* Danh sách môn dưới dạng card list */}
      {registrations.length > 0 && (
        <Card title="Danh sách môn đăng ký" subtitle={`${registrations.length} môn · ${totalCredits} tín chỉ`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {registrations.map((r) => (
              <div
                key={r.id}
                className="border border-line rounded-md p-3 flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-md bg-navy-50 text-navy-600 grid place-items-center flex-shrink-0 font-mono text-[11px] font-semibold">
                  {r.course_credits}TC
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-mono text-[12px] text-ink-muted">
                      {r.course_code}
                    </span>
                    <span className="text-ink-faint">·</span>
                    <span className="font-mono text-[12px] text-ink-muted">
                      {r.class_section_code}
                    </span>
                  </div>
                  <div className="text-[13px] font-medium text-ink truncate">
                    {r.course_name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modal chi tiết buổi học */}
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
                label="Giáo viên"
                value={selectedEvent.teacher_name || "—"}
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
              <Badge tone="accent">Đã đăng ký</Badge>
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
