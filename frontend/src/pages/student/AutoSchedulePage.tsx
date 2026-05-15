import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, Modal, ScheduleGrid, type ScheduleEvent } from "@/components/ui";
import Icon from "@/components/ui/Icon";
import { api } from "@/api/client";
import { listSemesters } from "@/api/semesters";
import { listClassSections } from "@/api/classes";
import { getMyCurriculum } from "@/api/curriculums";
import { listGrades } from "@/api/grades";
import {
  PRESET_DESCRIPTIONS,
  PRESET_LABELS,
  SESSION_OPTIONS,
  suggestSchedules,
  type AutoScheduleCandidate,
  type PriorityPreset,
  type Session,
} from "@/api/autoSchedule";
import { extractApiError } from "@/lib/errors";
import {
  WEEKDAY_LABELS,
  type Semester,
} from "@/types/domain";

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;
const PRESETS: PriorityPreset[] = ["BALANCED", "TEACHER_FIRST", "SESSION_FIRST", "COMPACT_FIRST"];

// Một môn lấy từ class-sections OPEN — có thêm thông tin lớp + GV
interface OpenCourseOption {
  id: number;
  code: string;
  name: string;
  credits: number;
  classSectionCount: number;
  teachers: TeacherOption[];
}

interface TeacherOption {
  id: number;
  code: string | null;
  name: string | null;
}

export default function StudentAutoSchedulePage() {
  const navigate = useNavigate();
  const [view, setView] = useState<"form" | "results">("form");

  // Form data
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [semesterId, setSemesterId] = useState<number | "">("");
  const [openCourses, setOpenCourses] = useState<OpenCourseOption[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  // Curriculum + passed (cho filter)
  const [curriculumCourseIds, setCurriculumCourseIds] = useState<Set<number>>(new Set());
  const [passedCourseIds, setPassedCourseIds] = useState<Set<number>>(new Set());

  // Form selections
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<number>>(new Set());
  // Map courseId → teacherId (hard constraint)
  const [teacherByCourse, setTeacherByCourse] = useState<Map<number, number>>(new Map());

  // Filter UI
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCurriculum, setFilterCurriculum] = useState(false);
  const [filterUnpassed, setFilterUnpassed] = useState(false);

  // Preferences
  const [avoidWeekdays, setAvoidWeekdays] = useState<Set<number>>(new Set());
  const [preferredSessions, setPreferredSessions] = useState<Set<Session>>(new Set());
  const [minimizeGaps, setMinimizeGaps] = useState(true);
  const [preset, setPreset] = useState<PriorityPreset>("BALANCED");

  // Results
  const [results, setResults] = useState<AutoScheduleCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<"total" | "weekday" | "session" | "teacher" | "gap">("total");
  const [sessionFilter, setSessionFilter] = useState<Set<Session>>(new Set());

  // Detail / apply modal
  const [detailIdx, setDetailIdx] = useState<number | null>(null);
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<{ ok: number; failed: { code: string; msg: string }[] } | null>(null);

  // 1. Load semesters
  useEffect(() => {
    listSemesters({ page_size: 1000 })
      .then((r) => {
        setSemesters(r.results);
        const open = r.results.find((s) => s.is_open);
        setSemesterId(open?.id ?? r.results[0]?.id ?? "");
      })
      .catch((err) => setError(extractApiError(err, "Không tải được học kỳ.")));
  }, []);

  // 2. Load CTĐT + grades 1 lần (đứng độc lập với semester)
  useEffect(() => {
    getMyCurriculum()
      .then((c) => setCurriculumCourseIds(new Set(c.curriculum_courses.map((cc) => cc.course))))
      .catch(() => {
        // SV chưa match CTĐT — bỏ qua filter
      });
    listGrades({ page_size: 1000 })
      .then((r) => {
        const passed = new Set<number>();
        for (const g of r.results) {
          if (g.gpa_4 !== null && parseFloat(g.gpa_4) > 0) {
            passed.add(g.course);
          }
        }
        setPassedCourseIds(passed);
      })
      .catch(() => {
        // không có grade — bỏ qua filter
      });
  }, []);

  // 3. Load class-sections OPEN của semester → group thành OpenCourseOption
  useEffect(() => {
    if (!semesterId) {
      setOpenCourses([]);
      return;
    }
    let cancelled = false;
    setCoursesLoading(true);
    listClassSections({
      semester: Number(semesterId),
      status: "OPEN",
      page_size: 1000,
    })
      .then((r) => {
        if (cancelled) return;
        const courseMap = new Map<number, OpenCourseOption>();
        for (const cs of r.results) {
          let opt = courseMap.get(cs.course);
          if (!opt) {
            opt = {
              id: cs.course,
              code: cs.course_code,
              name: cs.course_name,
              credits: cs.course_credits,
              classSectionCount: 0,
              teachers: [],
            };
            courseMap.set(cs.course, opt);
          }
          opt.classSectionCount += 1;
          if (cs.teacher !== null && !opt.teachers.some((t) => t.id === cs.teacher)) {
            opt.teachers.push({
              id: cs.teacher,
              code: cs.teacher_code,
              name: cs.teacher_name,
            });
          }
        }
        const list = Array.from(courseMap.values()).sort((a, b) => a.code.localeCompare(b.code));
        setOpenCourses(list);
      })
      .catch((err) => setError(extractApiError(err, "Không tải được lớp HP.")))
      .finally(() => {
        if (!cancelled) setCoursesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [semesterId]);

  // Áp filter + search lên danh sách môn
  const filteredCourses = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return openCourses.filter((c) => {
      // Search
      if (term && !c.code.toLowerCase().includes(term) && !c.name.toLowerCase().includes(term)) {
        return false;
      }
      // CTĐT
      if (filterCurriculum && curriculumCourseIds.size > 0 && !curriculumCourseIds.has(c.id)) {
        return false;
      }
      // Đã pass
      if (filterUnpassed && passedCourseIds.has(c.id)) {
        return false;
      }
      return true;
    });
  }, [openCourses, searchTerm, filterCurriculum, filterUnpassed, curriculumCourseIds, passedCourseIds]);

  function toggleSet<T>(set: Set<T>, value: T, setFn: (s: Set<T>) => void) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setFn(next);
  }

  function toggleCourse(courseId: number) {
    const next = new Set(selectedCourseIds);
    if (next.has(courseId)) {
      next.delete(courseId);
      // Xoá teacher constraint của môn vừa bỏ
      const nextTeacher = new Map(teacherByCourse);
      nextTeacher.delete(courseId);
      setTeacherByCourse(nextTeacher);
    } else {
      next.add(courseId);
    }
    setSelectedCourseIds(next);
  }

  function setCourseTeacher(courseId: number, teacherId: number | null) {
    const next = new Map(teacherByCourse);
    if (teacherId === null) next.delete(courseId);
    else next.set(courseId, teacherId);
    setTeacherByCourse(next);
  }

  const handleSearch = useCallback(async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!semesterId || selectedCourseIds.size === 0) {
      setError("Vui lòng chọn học kỳ + ít nhất 1 môn.");
      return;
    }
    setSearching(true);
    setError(null);
    setResults([]);

    // Convert teacherByCourse → { [course_id_string]: teacher_id }
    const constraints: Record<string, number> = {};
    teacherByCourse.forEach((teacherId, courseId) => {
      if (selectedCourseIds.has(courseId)) {
        constraints[String(courseId)] = teacherId;
      }
    });

    try {
      const data = await suggestSchedules({
        semester: Number(semesterId),
        course_ids: Array.from(selectedCourseIds),
        avoid_weekdays: Array.from(avoidWeekdays),
        preferred_sessions: Array.from(preferredSessions),
        minimize_gaps: minimizeGaps,
        preset,
        course_teacher_constraints: constraints,
      });
      setResults(data.results);
      setView("results");
      if (data.results.length === 0) {
        setError("Không có phương án nào không trùng lịch. Hãy quay lại tinh chỉnh.");
      }
    } catch (err) {
      setError(extractApiError(err, "Không tạo được TKB."));
    } finally {
      setSearching(false);
    }
  }, [semesterId, selectedCourseIds, teacherByCourse, avoidWeekdays, preferredSessions, minimizeGaps, preset]);

  const displayed = useMemo(() => {
    let arr = results;
    if (sessionFilter.size > 0) {
      arr = arr.filter((c) =>
        c.class_sections.every((cs) =>
          cs.schedules.every((s) => sessionFilter.has(s.session as Session)),
        ),
      );
    }
    return [...arr].sort((a, b) => b.breakdown[sortKey] - a.breakdown[sortKey]);
  }, [results, sortKey, sessionFilter]);

  async function handleApply(cand: AutoScheduleCandidate) {
    setApplying(true);
    setApplyResult(null);
    const ok: number[] = [];
    const failed: { code: string; msg: string }[] = [];
    for (const cs of cand.class_sections) {
      try {
        await api.post("/registrations/", { class_section: cs.id });
        ok.push(cs.id);
      } catch (err) {
        failed.push({ code: cs.code, msg: extractApiError(err, "Lỗi đăng ký") });
      }
    }
    setApplyResult({ ok: ok.length, failed });
    setApplying(false);
    if (failed.length === 0) {
      setTimeout(() => navigate("/student/history"), 1500);
    }
  }

  const detailCandidate = detailIdx !== null ? displayed[detailIdx] : null;
  const selectedSemester = semesters.find((s) => s.id === semesterId);

  if (view === "form") {
    return (
      <FormView
        semesters={semesters}
        semesterId={semesterId}
        setSemesterId={setSemesterId}
        openCourses={openCourses}
        filteredCourses={filteredCourses}
        coursesLoading={coursesLoading}
        selectedCourseIds={selectedCourseIds}
        toggleCourse={toggleCourse}
        teacherByCourse={teacherByCourse}
        setCourseTeacher={setCourseTeacher}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        hasCurriculum={curriculumCourseIds.size > 0}
        filterCurriculum={filterCurriculum}
        setFilterCurriculum={setFilterCurriculum}
        hasPassed={passedCourseIds.size > 0}
        filterUnpassed={filterUnpassed}
        setFilterUnpassed={setFilterUnpassed}
        avoidWeekdays={avoidWeekdays}
        setAvoidWeekdays={setAvoidWeekdays}
        preferredSessions={preferredSessions}
        setPreferredSessions={setPreferredSessions}
        minimizeGaps={minimizeGaps}
        setMinimizeGaps={setMinimizeGaps}
        preset={preset}
        setPreset={setPreset}
        toggleSet={toggleSet}
        onSubmit={handleSearch}
        searching={searching}
        error={error}
        hasPreviousResults={results.length > 0}
        onBackToResults={() => setView("results")}
      />
    );
  }

  // ───── view === "results" ─────
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" icon="chevronLeft" onClick={() => setView("form")}>
              Tinh chỉnh tìm kiếm
            </Button>
            <h1 className="m-0 text-[20px] font-semibold tracking-tight text-ink">
              Kết quả TKB tự động
            </h1>
          </div>
          <p className="mt-1 text-[12.5px] text-ink-muted">
            {selectedSemester?.code ?? "—"} · {selectedCourseIds.size} môn ·
            chế độ <strong className="text-ink">{PRESET_LABELS[preset]}</strong>
            {avoidWeekdays.size > 0 && (
              <> · tránh {Array.from(avoidWeekdays).sort().map(formatWeekday).join("/")}</>
            )}
            {preferredSessions.size > 0 && (
              <> · ưu tiên {Array.from(preferredSessions).map(sessionLabel).join("/")}</>
            )}
            {teacherByCourse.size > 0 && <> · {teacherByCourse.size} môn khoá GV</>}
          </p>
        </div>
        <Button variant="secondary" icon="sparkle" onClick={() => handleSearch()} disabled={searching}>
          {searching ? "Đang tìm..." : "Tìm lại với cấu hình này"}
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="m-0 text-[15px] font-semibold text-ink">
          {results.length > 0 ? `${displayed.length}/${results.length} phương án` : "0 phương án"}
        </h2>
        {results.length > 0 && (
          <>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[12px] text-ink-muted">Sắp xếp:</span>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
                className="px-2 py-1 rounded-md bg-card border border-line text-[12.5px]"
              >
                <option value="total">Tổng điểm</option>
                <option value="weekday">Weekday</option>
                <option value="session">Session</option>
                <option value="teacher">Teacher</option>
                <option value="gap">Gap</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-ink-muted">Filter ca:</span>
              {SESSION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleSet(sessionFilter, opt.value, setSessionFilter)}
                  className={`px-2 py-1 rounded text-[11px] border ${
                    sessionFilter.has(opt.value)
                      ? "bg-navy-600 text-white border-navy-600"
                      : "bg-card border-line text-ink-muted hover:border-navy-400"
                  }`}
                >
                  {opt.label.split(" (")[0]}
                </button>
              ))}
              {sessionFilter.size > 0 && (
                <button
                  type="button"
                  onClick={() => setSessionFilter(new Set())}
                  className="text-[11px] text-ink-muted hover:text-ink underline"
                >
                  Xoá
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {searching && <div className="text-ink-muted">Đang xếp lịch...</div>}

      {!searching && results.length === 0 && (
        <Card>
          <div className="py-12 text-center">
            <div className="w-14 h-14 rounded-xl bg-surface text-ink-faint grid place-items-center mx-auto mb-3">
              <Icon name="sparkle" size={28} />
            </div>
            <div className="text-[14.5px] font-semibold text-ink">Không có phương án khả thi</div>
            <p className="text-[13px] text-ink-muted mt-1 mb-3">
              Các môn bạn chọn có lịch xung đột với nhau hoặc lớp đã đầy. Hãy quay lại tinh chỉnh.
            </p>
            <Button variant="primary" icon="chevronLeft" onClick={() => setView("form")}>
              Quay lại tinh chỉnh
            </Button>
          </div>
        </Card>
      )}

      {displayed.map((cand, idx) => (
        <CandidateCard
          key={idx}
          cand={cand}
          rank={idx + 1}
          onDetail={() => setDetailIdx(idx)}
          onApply={() => {
            setDetailIdx(idx);
            setApplyResult(null);
          }}
        />
      ))}

      {/* Detail modal */}
      <Modal
        open={detailCandidate !== null}
        title={detailCandidate ? `Phương án (score ${detailCandidate.score.toFixed(2)})` : ""}
        subtitle={detailCandidate ? `${detailCandidate.class_sections.length} lớp HP` : ""}
        onClose={() => {
          setDetailIdx(null);
          setApplyResult(null);
        }}
        size="lg"
        footer={
          detailCandidate && !applyResult ? (
            <>
              <Button variant="ghost" onClick={() => setDetailIdx(null)}>
                Đóng
              </Button>
              <Button
                variant="primary"
                icon="check"
                onClick={() => handleApply(detailCandidate)}
                disabled={applying}
              >
                {applying
                  ? "Đang đăng ký..."
                  : `Áp dụng (đăng ký ${detailCandidate.class_sections.length} lớp)`}
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => setDetailIdx(null)}>
              Đóng
            </Button>
          )
        }
      >
        {detailCandidate && (
          <div className="space-y-4">
            <BreakdownBars breakdown={detailCandidate.breakdown} />
            <div>
              <div className="text-[12.5px] font-medium text-ink mb-1.5">Lớp HP trong phương án</div>
              <div className="space-y-1.5">
                {detailCandidate.class_sections.map((cs) => (
                  <div key={cs.id} className="px-3 py-2 rounded-md border border-line bg-card text-[12.5px]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-ink-muted">{cs.code}</span>
                      <span className="font-semibold">{cs.course_code} – {cs.course_name}</span>
                      <Badge tone="accent">{cs.course_credits} TC</Badge>
                    </div>
                    <div className="text-[11.5px] text-ink-muted mt-1">
                      GV: {cs.teacher_name ?? "—"} ·{" "}
                      {cs.schedules.map((s) =>
                        `${WEEKDAY_LABELS[s.weekday]} tiết ${s.start_period}-${s.end_period} ${s.room}`,
                      ).join(" · ")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[12.5px] font-medium text-ink mb-1.5">Preview TKB</div>
              <ScheduleGrid events={candidateToEvents(detailCandidate)} />
            </div>
            {applyResult && (
              <div
                className={`rounded-md border px-3 py-2 text-[13px] ${
                  applyResult.failed.length === 0
                    ? "bg-green-50 border-green-200 text-success"
                    : "bg-amber-50 border-amber-200 text-warn"
                }`}
              >
                <div className="font-semibold">
                  Đã đăng ký {applyResult.ok} / {applyResult.ok + applyResult.failed.length} lớp.
                </div>
                {applyResult.failed.length > 0 && (
                  <ul className="mt-2 text-[12.5px] space-y-0.5">
                    {applyResult.failed.map((f) => (
                      <li key={f.code}>
                        <code className="font-mono">{f.code}</code>: {f.msg}
                      </li>
                    ))}
                  </ul>
                )}
                {applyResult.failed.length === 0 && (
                  <div className="text-[12px] mt-1">Đang chuyển sang Lịch sử đăng ký...</div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

// ────────────────────────────── FormView ──────────────────────────────

interface FormViewProps {
  semesters: Semester[];
  semesterId: number | "";
  setSemesterId: (v: number | "") => void;
  openCourses: OpenCourseOption[];
  filteredCourses: OpenCourseOption[];
  coursesLoading: boolean;
  selectedCourseIds: Set<number>;
  toggleCourse: (courseId: number) => void;
  teacherByCourse: Map<number, number>;
  setCourseTeacher: (courseId: number, teacherId: number | null) => void;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  hasCurriculum: boolean;
  filterCurriculum: boolean;
  setFilterCurriculum: (v: boolean) => void;
  hasPassed: boolean;
  filterUnpassed: boolean;
  setFilterUnpassed: (v: boolean) => void;
  avoidWeekdays: Set<number>;
  setAvoidWeekdays: (s: Set<number>) => void;
  preferredSessions: Set<Session>;
  setPreferredSessions: (s: Set<Session>) => void;
  minimizeGaps: boolean;
  setMinimizeGaps: (v: boolean) => void;
  preset: PriorityPreset;
  setPreset: (p: PriorityPreset) => void;
  toggleSet: <T>(set: Set<T>, value: T, setFn: (s: Set<T>) => void) => void;
  onSubmit: (e?: FormEvent) => void;
  searching: boolean;
  error: string | null;
  hasPreviousResults: boolean;
  onBackToResults: () => void;
}

function FormView(props: FormViewProps) {
  const {
    semesters, semesterId, setSemesterId,
    openCourses, filteredCourses, coursesLoading,
    selectedCourseIds, toggleCourse,
    teacherByCourse, setCourseTeacher,
    searchTerm, setSearchTerm,
    hasCurriculum, filterCurriculum, setFilterCurriculum,
    hasPassed, filterUnpassed, setFilterUnpassed,
    avoidWeekdays, setAvoidWeekdays,
    preferredSessions, setPreferredSessions,
    minimizeGaps, setMinimizeGaps,
    preset, setPreset,
    toggleSet,
    onSubmit, searching, error,
    hasPreviousResults, onBackToResults,
  } = props;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h1 className="m-0 text-[22px] font-semibold tracking-tight text-ink">
            Tạo TKB tự động
          </h1>
          <p className="mt-1 text-[13px] text-ink-muted">
            Chọn môn (chỉ hiển thị môn có lớp HP đang mở) + cấu hình ưu tiên → hệ thống tìm tất cả tổ hợp lớp HP không trùng lịch.
          </p>
        </div>
        {hasPreviousResults && (
          <Button variant="ghost" icon="chevronRight" onClick={onBackToResults}>
            Xem kết quả trước
          </Button>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <Card title="1. Chọn học kỳ và môn học">
          <div className="space-y-4">
            {/* Semester */}
            <div>
              <Label>Học kỳ *</Label>
              <select
                required
                value={semesterId}
                onChange={(e) => setSemesterId(e.target.value ? Number(e.target.value) : "")}
                className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px]"
              >
                <option value="">— Chọn —</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} {s.is_open ? "(đang mở)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter bar: search + 2 checkbox */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex-1 min-w-[240px] relative">
                <Icon name="search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm môn theo mã hoặc tên..."
                  className="w-full pl-8 pr-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
                />
              </div>
              {hasCurriculum && (
                <label className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md border text-[12.5px] cursor-pointer ${filterCurriculum ? "bg-navy-50 border-navy-300 text-navy-900" : "bg-card border-line text-ink-muted hover:border-navy-400"}`}>
                  <input
                    type="checkbox"
                    checked={filterCurriculum}
                    onChange={(e) => setFilterCurriculum(e.target.checked)}
                    className="accent-navy-600"
                  />
                  Chỉ môn trong CTĐT
                </label>
              )}
              {hasPassed && (
                <label className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md border text-[12.5px] cursor-pointer ${filterUnpassed ? "bg-navy-50 border-navy-300 text-navy-900" : "bg-card border-line text-ink-muted hover:border-navy-400"}`}>
                  <input
                    type="checkbox"
                    checked={filterUnpassed}
                    onChange={(e) => setFilterUnpassed(e.target.checked)}
                    className="accent-navy-600"
                  />
                  Ẩn môn đã pass
                </label>
              )}
            </div>

            {/* Course list */}
            <div>
              <Label>
                Môn muốn học *{" "}
                <span className="text-ink-faint font-normal">
                  ({selectedCourseIds.size}/10 đã chọn ·
                  {coursesLoading ? " đang tải..." : ` ${filteredCourses.length}/${openCourses.length} môn`})
                </span>
              </Label>
              <div className="max-h-[480px] overflow-y-auto border border-line rounded-md p-1.5 space-y-1 bg-card">
                {!coursesLoading && filteredCourses.length === 0 && (
                  <div className="px-2 py-6 text-center text-[12.5px] text-ink-faint">
                    {openCourses.length === 0
                      ? "Học kỳ này chưa có lớp HP đang mở."
                      : "Không có môn nào khớp filter."}
                  </div>
                )}
                {filteredCourses.map((c) => {
                  const checked = selectedCourseIds.has(c.id);
                  const disabled = !checked && selectedCourseIds.size >= 10;
                  const teacherId = teacherByCourse.get(c.id) ?? null;
                  return (
                    <div
                      key={c.id}
                      className={`rounded ${checked ? "bg-navy-50 border border-navy-100" : "border border-transparent hover:bg-surface"}`}
                    >
                      <label
                        className={`flex items-center gap-2 px-2 py-1.5 text-[13px] cursor-pointer ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggleCourse(c.id)}
                          className="accent-navy-600"
                        />
                        <span className="font-mono text-[12px] text-ink-muted w-20 flex-shrink-0">
                          {c.code}
                        </span>
                        <span className="flex-1 truncate">{c.name}</span>
                        <span className="text-[11.5px] text-ink-faint">{c.classSectionCount} lớp · {c.credits} TC</span>
                      </label>
                      {checked && c.teachers.length > 0 && (
                        <div className="px-2 pb-2 pl-9">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11.5px] text-ink-muted">Chọn GV:</span>
                            <button
                              type="button"
                              onClick={() => setCourseTeacher(c.id, null)}
                              className={`px-2 py-0.5 rounded text-[11.5px] border ${
                                teacherId === null
                                  ? "bg-navy-600 text-white border-navy-600"
                                  : "bg-card border-line text-ink-muted hover:border-navy-400"
                              }`}
                            >
                              Bất kỳ
                            </button>
                            {c.teachers.map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => setCourseTeacher(c.id, t.id)}
                                className={`px-2 py-0.5 rounded text-[11.5px] border ${
                                  teacherId === t.id
                                    ? "bg-navy-600 text-white border-navy-600"
                                    : "bg-card border-line text-ink-muted hover:border-navy-400"
                                }`}
                                title={t.code ?? ""}
                              >
                                {t.name ?? t.code ?? `GV ${t.id}`}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        <Card title="2. Ưu tiên cá nhân" subtitle="Tuỳ chọn — bỏ trống = không thiên vị">
          <div className="space-y-4">
            <div>
              <Label>Tránh ngày trong tuần</Label>
              <div className="grid grid-cols-7 gap-1.5">
                {WEEKDAYS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleSet(avoidWeekdays, d, setAvoidWeekdays)}
                    className={`px-2 py-2 rounded text-[12px] border ${
                      avoidWeekdays.has(d)
                        ? "bg-navy-600 text-white border-navy-600"
                        : "bg-card border-line text-ink-muted hover:border-navy-400"
                    }`}
                  >
                    {formatWeekday(d)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Ca học ưu tiên</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {SESSION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleSet(preferredSessions, opt.value, setPreferredSessions)}
                    className={`px-3 py-2 rounded text-[12.5px] border ${
                      preferredSessions.has(opt.value)
                        ? "bg-navy-600 text-white border-navy-600"
                        : "bg-card border-line text-ink-muted hover:border-navy-400"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-[13px] cursor-pointer">
              <input
                type="checkbox"
                checked={minimizeGaps}
                onChange={(e) => setMinimizeGaps(e.target.checked)}
                className="accent-navy-600 w-4 h-4"
              />
              <span>Tối thiểu khoảng trống giữa các buổi trong cùng 1 ngày</span>
            </label>
          </div>
        </Card>

        <Card title="3. Chế độ ưu tiên" subtitle="Chọn 1 chế độ — quyết định cách hệ thống xếp hạng các phương án">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {PRESETS.map((p) => (
              <label
                key={p}
                className={`block px-3 py-2.5 rounded border cursor-pointer text-[13px] transition-colors ${
                  preset === p
                    ? "border-navy-600 bg-navy-50 ring-1 ring-navy-100"
                    : "border-line hover:border-navy-400"
                }`}
              >
                <div className="flex items-start gap-2">
                  <input
                    type="radio"
                    name="preset"
                    checked={preset === p}
                    onChange={() => setPreset(p)}
                    className="accent-navy-600 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{PRESET_LABELS[p]}</div>
                    <div className="text-[11.5px] text-ink-muted mt-0.5">
                      {PRESET_DESCRIPTIONS[p]}
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </Card>

        {error && (
          <div className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <div className="sticky bottom-0 bg-bg pt-3 pb-1 -mx-1 px-1 border-t border-line/60">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            icon="sparkle"
            className="w-full justify-center"
            disabled={searching || !semesterId || selectedCourseIds.size === 0}
          >
            {searching ? "Đang tìm phương án..." : "Tìm phương án"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ────────────────────────────── Sub-components ──────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[12.5px] font-medium text-ink mb-1.5">{children}</div>;
}

function CandidateCard({
  cand, rank, onDetail, onApply,
}: {
  cand: AutoScheduleCandidate;
  rank: number;
  onDetail: () => void;
  onApply: () => void;
}) {
  return (
    <Card>
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge tone={rank === 1 ? "success" : "accent"}>#{rank}</Badge>
            <span className="text-[18px] font-semibold tracking-tight text-ink">
              Score {cand.score.toFixed(2)}
            </span>
            <span className="text-[12px] text-ink-muted">
              · {cand.class_sections.length} lớp HP
            </span>
          </div>
          <div className="mt-2 flex gap-3 text-[11.5px] text-ink-muted flex-wrap">
            <span>Weekday: <strong className="text-ink">{cand.breakdown.weekday.toFixed(0)}</strong></span>
            <span>Session: <strong className="text-ink">{cand.breakdown.session.toFixed(0)}</strong></span>
            <span>Teacher: <strong className="text-ink">{cand.breakdown.teacher.toFixed(0)}</strong></span>
            <span>Gap: <strong className="text-ink">{cand.breakdown.gap.toFixed(0)}</strong></span>
          </div>
          <div className="mt-2 flex gap-1.5 flex-wrap">
            {cand.class_sections.map((cs) => (
              <span
                key={cs.id}
                className="text-[11.5px] font-mono px-2 py-0.5 rounded bg-surface text-ink-muted"
              >
                {cs.code}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={onDetail}>
            Xem chi tiết
          </Button>
          <Button variant="primary" size="sm" icon="check" onClick={onApply}>
            Áp dụng
          </Button>
        </div>
      </div>
    </Card>
  );
}

function BreakdownBars({ breakdown }: { breakdown: AutoScheduleCandidate["breakdown"] }) {
  const items: Array<[string, number]> = [
    ["Weekday", breakdown.weekday],
    ["Session", breakdown.session],
    ["Teacher", breakdown.teacher],
    ["Gap", breakdown.gap],
  ];
  return (
    <div className="space-y-1.5">
      {items.map(([label, val]) => (
        <div key={label} className="flex items-center gap-3 text-[12px]">
          <span className="w-20 text-ink-muted">{label}</span>
          <div className="flex-1 h-2 rounded-full bg-surface overflow-hidden">
            <div className="h-full bg-navy-600 rounded-full" style={{ width: `${val}%` }} />
          </div>
          <span className="w-12 text-right font-mono text-ink">{val.toFixed(0)}</span>
        </div>
      ))}
    </div>
  );
}

function candidateToEvents(cand: AutoScheduleCandidate): ScheduleEvent[] {
  const events: ScheduleEvent[] = [];
  cand.class_sections.forEach((cs, idx) => {
    for (const s of cs.schedules) {
      events.push({
        id: `${cs.id}-${s.id}`,
        weekday: s.weekday,
        start_period: s.start_period,
        end_period: s.end_period,
        title: cs.course_code,
        subtitle: cs.course_name,
        meta: s.room,
        colorIndex: idx,
      });
    }
  });
  return events;
}

function formatWeekday(d: number): string {
  if (d === 6) return "CN";
  return `T${d + 2}`;
}

function sessionLabel(s: Session): string {
  if (s === "MORNING") return "sáng";
  if (s === "AFTERNOON") return "chiều";
  return "tối";
}
