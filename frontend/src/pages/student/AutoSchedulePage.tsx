import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, Modal, ScheduleGrid, type ScheduleEvent } from "@/components/ui";
import Icon from "@/components/ui/Icon";
import { api } from "@/api/client";
import { listSemesters } from "@/api/semesters";
import {
  SESSION_OPTIONS,
  listAvailableCourses,
  suggestSchedules,
  type AutoScheduleCandidate,
  type AvailableCourse,
  type Session,
} from "@/api/autoSchedule";
import { extractApiError } from "@/lib/errors";
import { formatRegistrationWindow, pickActiveSemester, type SemesterStatus } from "@/lib/semester";
import {
  WEEKDAY_LABELS,
  type Semester,
} from "@/types/domain";

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

type CourseStatus = "available" | "learned" | "missing_prereq" | "registered";
type SelectedCourseSummary = {
  id: number;
  code: string;
  name: string;
  credits?: number;
  teacherName: string;
};

function getCourseStatus(c: AvailableCourse): CourseStatus {
  if (c.has_grade) return "learned";
  if (c.missing_prerequisites.length > 0) return "missing_prereq";
  if (c.registered) return "registered";
  return "available";
}

const STATUS_BADGE: Record<CourseStatus, { label: string; tone: "neutral" | "accent" | "success" | "warn" | "danger" }> = {
  available: { label: "Có thể đăng ký", tone: "success" },
  learned: { label: "Đã học", tone: "neutral" },
  missing_prereq: { label: "Thiếu tiên quyết", tone: "warn" },
  registered: { label: "Đã đăng ký", tone: "accent" },
};

const BREAKDOWN_LABELS = {
  total: "Tổng điểm",
  weekday: "Ngày học",
  session: "Ca học",
  teacher: "Giáo viên",
  free_day: "Ngày nghỉ",
} as const;

function extractApiDetails(err: unknown): string[] {
  if (!(err instanceof AxiosError) || !err.response) return [];
  const data = err.response.data;
  if (!data || typeof data !== "object" || !("details" in data)) return [];
  const details = (data as { details?: unknown }).details;
  if (!Array.isArray(details)) return [];
  return details.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export default function StudentAutoSchedulePage() {
  const navigate = useNavigate();
  const [view, setView] = useState<"form" | "results">("form");

  // Semester + courses (auto-pick active hoặc upcoming, không cho user chọn)
  const [semester, setSemester] = useState<Semester | null>(null);
  const [semesterStatus, setSemesterStatus] = useState<SemesterStatus>("none");
  const semesterId = semester?.id ?? "";
  const [availableCourses, setAvailableCourses] = useState<AvailableCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  // Selections
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<number>>(new Set());
  const [teacherByCourse, setTeacherByCourse] = useState<Map<number, number>>(new Map());
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null);

  // Filter UI
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUnlearned, setFilterUnlearned] = useState(false);

  // Preferences
  const [avoidWeekdays, setAvoidWeekdays] = useState<Set<number>>(new Set());
  const [preferredSessions, setPreferredSessions] = useState<Set<Session>>(new Set());
  const [optimizeFreeDays, setOptimizeFreeDays] = useState(false);

  // Results
  const [results, setResults] = useState<AutoScheduleCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<"total" | "weekday" | "session" | "teacher" | "free_day">("total");

  // Detail modal
  const [detailIdx, setDetailIdx] = useState<number | null>(null);
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<{ ok: number; failed: { code: string; msg: string }[] } | null>(null);

  // Load semesters + auto-pick active hoặc upcoming
  useEffect(() => {
    listSemesters({ page_size: 1000 })
      .then((r) => {
        const result = pickActiveSemester(r.results);
        setSemester(result.semester);
        setSemesterStatus(result.status);
      })
      .catch((err) => {
        setErrorDetails([]);
        setError(extractApiError(err, "Không tải được học kỳ."));
      });
  }, []);

  // Load available courses khi semester/search/filter thay đổi (debounce search)
  useEffect(() => {
    if (!semesterId) {
      setAvailableCourses([]);
      return;
    }
    let cancelled = false;
    setCoursesLoading(true);
    const t = setTimeout(() => {
      listAvailableCourses({
        semester: Number(semesterId),
        search: searchTerm,
        unlearned_only: filterUnlearned,
      })
        .then((r) => {
          if (!cancelled) setAvailableCourses(r.results);
        })
        .catch((err) => {
          if (!cancelled) {
            setErrorDetails([]);
            setError(extractApiError(err, "Không tải được danh sách môn."));
          }
        })
        .finally(() => {
          if (!cancelled) setCoursesLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [semesterId, searchTerm, filterUnlearned]);

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
      const nextT = new Map(teacherByCourse);
      nextT.delete(courseId);
      setTeacherByCourse(nextT);
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
      setErrorDetails([]);
      setError("Vui lòng chọn học kỳ + ít nhất 1 môn.");
      return;
    }
    setSearching(true);
    setError(null);
    setErrorDetails([]);
    setResults([]);

    const constraints: Record<string, number> = {};
    teacherByCourse.forEach((teacherId, courseId) => {
      if (selectedCourseIds.has(courseId)) constraints[String(courseId)] = teacherId;
    });

    try {
      const data = await suggestSchedules({
        semester: Number(semesterId),
        course_ids: Array.from(selectedCourseIds),
        avoid_weekdays: Array.from(avoidWeekdays),
        preferred_sessions: Array.from(preferredSessions),
        preset: optimizeFreeDays ? "COMPACT_FIRST" : "AUTO",
        course_teacher_constraints: constraints,
      });
      setResults(data.results);
      setView("results");
      if (data.results.length === 0) {
        setErrorDetails([]);
        setError("Không có phương án nào không trùng lịch. Hãy quay lại tinh chỉnh.");
      }
    } catch (err) {
      setErrorDetails(extractApiDetails(err));
      setError(extractApiError(err, "Không tạo được TKB."));
    } finally {
      setSearching(false);
    }
  }, [semesterId, selectedCourseIds, teacherByCourse, avoidWeekdays, preferredSessions, optimizeFreeDays]);

  const displayed = useMemo(() => {
    return [...results].sort((a, b) => b.breakdown[sortKey] - a.breakdown[sortKey]);
  }, [results, sortKey]);

  const selectedCourseSummaries = useMemo<SelectedCourseSummary[]>(() => {
    const byId = new Map(availableCourses.map((course) => [course.course_id, course]));
    return Array.from(selectedCourseIds).map((courseId) => {
      const course = byId.get(courseId);
      const teacherId = teacherByCourse.get(courseId) ?? null;
      const teacher = course?.teachers.find((item) => item.teacher_id === teacherId);
      return {
        id: courseId,
        code: course?.course_code ?? `Môn #${courseId}`,
        name: course?.course_name ?? "Môn đã chọn",
        credits: course?.credits,
        teacherName: teacherId === null ? "Tự chọn lớp/GV" : teacher?.teacher_name ?? `GV ${teacherId}`,
      };
    });
  }, [availableCourses, selectedCourseIds, teacherByCourse]);

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

  if (view === "form") {
    return (
      <FormView
        semester={semester}
        semesterStatus={semesterStatus}
        availableCourses={availableCourses}
        coursesLoading={coursesLoading}
        selectedCourseIds={selectedCourseIds}
        toggleCourse={toggleCourse}
        teacherByCourse={teacherByCourse}
        setCourseTeacher={setCourseTeacher}
        expandedCourse={expandedCourse}
        setExpandedCourse={setExpandedCourse}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterUnlearned={filterUnlearned}
        setFilterUnlearned={setFilterUnlearned}
        avoidWeekdays={avoidWeekdays}
        setAvoidWeekdays={setAvoidWeekdays}
        preferredSessions={preferredSessions}
        setPreferredSessions={setPreferredSessions}
        optimizeFreeDays={optimizeFreeDays}
        setOptimizeFreeDays={setOptimizeFreeDays}
        toggleSet={toggleSet}
        onSubmit={handleSearch}
        searching={searching}
        error={error}
        errorDetails={errorDetails}
        hasPreviousResults={results.length > 0}
        onBackToResults={() => setView("results")}
      />
    );
  }

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
            Kiểm tra lại thông tin đã chọn trước khi áp dụng một phương án.
          </p>
        </div>
        <Button variant="secondary" icon="sparkle" onClick={() => handleSearch()} disabled={searching}>
          {searching ? "Đang tìm..." : "Tìm lại với cấu hình này"}
        </Button>
      </div>

      <SelectedInputSummary
        semester={semester}
        courses={selectedCourseSummaries}
        avoidWeekdays={avoidWeekdays}
        preferredSessions={preferredSessions}
        optimizeFreeDays={optimizeFreeDays}
        lockedTeacherCount={teacherByCourse.size}
      />

      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="m-0 text-[15px] font-semibold text-ink">
          {results.length > 0 ? `${displayed.length} phương án` : "0 phương án"}
        </h2>
        {results.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[12px] text-ink-muted">Sắp xếp:</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
              className="px-2 py-1 rounded-md bg-card border border-line text-[12.5px]"
            >
              <option value="total">Tổng điểm</option>
              <option value="weekday">Ngày học</option>
              <option value="session">Ca học</option>
              <option value="teacher">Giáo viên</option>
              <option value="free_day">Ngày nghỉ</option>
            </select>
          </div>
        )}
      </div>

      {error && (
        <ErrorAlert message={error} details={errorDetails} />
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

      {semesterStatus === "upcoming" && results.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-[13px] text-warn flex items-start gap-2">
          <Icon name="clock" size={16} className="mt-0.5 flex-shrink-0" />
          <div>
            Học kỳ <strong>sắp mở đăng ký</strong>. Bạn có thể xem trước các phương án nhưng <strong>chưa thể áp dụng đăng ký</strong> cho đến khi cửa sổ mở.
          </div>
        </div>
      )}

      {displayed.map((cand, idx) => (
        <CandidateCard
          key={idx}
          cand={cand}
          rank={idx + 1}
          applyDisabled={semesterStatus !== "active"}
          applyDisabledReason={
            semesterStatus === "upcoming" ? "Học kỳ sắp mở — chưa thể đăng ký" : ""
          }
          onDetail={() => setDetailIdx(idx)}
          onApply={() => {
            setDetailIdx(idx);
            setApplyResult(null);
          }}
        />
      ))}

      <Modal
        open={detailCandidate !== null}
        title={detailCandidate ? `Phương án (điểm ${detailCandidate.score.toFixed(2)})` : ""}
        subtitle={detailCandidate ? `${detailCandidate.class_sections.length} lớp HP · ${detailCandidate.stats.study_days} ngày học/${detailCandidate.stats.free_days} ngày nghỉ` : ""}
        onClose={() => {
          setDetailIdx(null);
          setApplyResult(null);
        }}
        size="xl"
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
                disabled={applying || semesterStatus !== "active"}
                title={
                  semesterStatus === "upcoming"
                    ? "Học kỳ sắp mở — chưa thể đăng ký"
                    : ""
                }
              >
                {applying
                  ? "Đang đăng ký..."
                  : semesterStatus === "upcoming"
                    ? "Sắp mở — chưa thể đăng ký"
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
              <div className="text-[12.5px] font-medium text-ink mb-1.5">Xem trước TKB</div>
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
  semester: Semester | null;
  semesterStatus: SemesterStatus;
  availableCourses: AvailableCourse[];
  coursesLoading: boolean;
  selectedCourseIds: Set<number>;
  toggleCourse: (courseId: number) => void;
  teacherByCourse: Map<number, number>;
  setCourseTeacher: (courseId: number, teacherId: number | null) => void;
  expandedCourse: number | null;
  setExpandedCourse: (v: number | null) => void;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filterUnlearned: boolean;
  setFilterUnlearned: (v: boolean) => void;
  avoidWeekdays: Set<number>;
  setAvoidWeekdays: (s: Set<number>) => void;
  preferredSessions: Set<Session>;
  setPreferredSessions: (s: Set<Session>) => void;
  optimizeFreeDays: boolean;
  setOptimizeFreeDays: (v: boolean) => void;
  toggleSet: <T>(set: Set<T>, value: T, setFn: (s: Set<T>) => void) => void;
  onSubmit: (e?: FormEvent) => void;
  searching: boolean;
  error: string | null;
  errorDetails: string[];
  hasPreviousResults: boolean;
  onBackToResults: () => void;
}

function FormView(props: FormViewProps) {
  const {
    semester, semesterStatus,
    availableCourses, coursesLoading,
    selectedCourseIds, toggleCourse,
    teacherByCourse, setCourseTeacher,
    expandedCourse, setExpandedCourse,
    searchTerm, setSearchTerm,
    filterUnlearned, setFilterUnlearned,
    avoidWeekdays, setAvoidWeekdays,
    preferredSessions, setPreferredSessions,
    optimizeFreeDays, setOptimizeFreeDays,
    toggleSet,
    onSubmit, searching, error, errorDetails,
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
            Chỉ hiển thị môn thuộc <strong>Chương trình đào tạo</strong> của bạn và có lớp HP đang mở. Chọn môn → cấu hình ưu tiên → tìm phương án.
          </p>
        </div>
        {hasPreviousResults && (
          <Button variant="ghost" icon="chevronRight" onClick={onBackToResults}>
            Xem kết quả trước
          </Button>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <Card title="1. Học kỳ và môn học">
          <div className="space-y-4">
            <SemesterBanner semester={semester} status={semesterStatus} />

            {semesterStatus === "none" && (
              <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-3 text-[13px] text-warn">
                Hiện chưa có học kỳ nào đang mở hoặc sắp mở đăng ký. Vui lòng quay lại sau.
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex-1 min-w-[240px] relative">
                <Icon name="search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm theo mã môn, tên môn, mã lớp, tên GV..."
                  className="w-full pl-8 pr-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
                />
              </div>
              <label className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md border text-[12.5px] cursor-pointer ${filterUnlearned ? "bg-navy-50 border-navy-300 text-navy-900" : "bg-card border-line text-ink-muted hover:border-navy-400"}`}>
                <input
                  type="checkbox"
                  checked={filterUnlearned}
                  onChange={(e) => setFilterUnlearned(e.target.checked)}
                  className="accent-navy-600"
                />
                Chỉ môn chưa học
              </label>
            </div>

            <div>
              <Label>
                Môn muốn học *{" "}
                <span className="text-ink-faint font-normal">
                  ({selectedCourseIds.size} đã chọn ·
                  {coursesLoading ? " đang tải..." : ` ${availableCourses.length} môn khả dụng`})
                </span>
              </Label>
              <div className="max-h-[520px] overflow-y-auto border border-line rounded-md p-1.5 space-y-1 bg-card">
                {!coursesLoading && availableCourses.length === 0 && (
                  <div className="px-2 py-8 text-center text-[12.5px] text-ink-faint">
                    {searchTerm
                      ? "Không có môn nào khớp tìm kiếm."
                      : "Học kỳ này chưa có môn nào khả dụng (chưa có lớp HP đang mở thuộc CTĐT của bạn)."}
                  </div>
                )}
                {availableCourses.map((c) => {
                  const checked = selectedCourseIds.has(c.course_id);
                  const status = getCourseStatus(c);
                  const blocked = status === "learned" || status === "missing_prereq";
                  const disabled = blocked;
                  const teacherId = teacherByCourse.get(c.course_id) ?? null;
                  const expanded = expandedCourse === c.course_id;
                  const totalClassSections = c.teachers.reduce((s, t) => s + t.class_sections.length, 0);
                  return (
                    <div
                      key={c.course_id}
                      className={`rounded ${checked ? "bg-navy-50 border border-navy-100" : "border border-transparent hover:bg-surface"}`}
                    >
                      <div className="flex items-center gap-2 px-2 py-1.5 text-[13px]">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => !disabled && toggleCourse(c.course_id)}
                          className={`accent-navy-600 ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                          title={
                            status === "learned" ? "Đã học rồi, không thể đăng ký lại."
                              : status === "missing_prereq" ? `Thiếu tiên quyết: ${c.missing_prerequisites.join(", ")}`
                              : ""
                          }
                        />
                        <span className="font-mono text-[12px] text-ink-muted w-20 flex-shrink-0">
                          {c.course_code}
                        </span>
                        <span className={`flex-1 truncate ${blocked ? "text-ink-faint" : ""}`}>{c.course_name}</span>
                        <Badge tone={STATUS_BADGE[status].tone}>
                          {STATUS_BADGE[status].label}
                        </Badge>
                        <span className="text-[11.5px] text-ink-faint w-16 text-right">
                          {totalClassSections} lớp · {c.credits} TC
                        </span>
                        <button
                          type="button"
                          onClick={() => setExpandedCourse(expanded ? null : c.course_id)}
                          className="text-ink-muted hover:text-ink"
                          aria-label="Toggle detail"
                        >
                          <Icon name={expanded ? "chevronDown" : "chevronRight"} size={14} />
                        </button>
                      </div>

                      {/* Chi tiết lớp HP của môn (expanded) */}
                      {expanded && (
                        <div className="px-2 pb-2 pl-9 space-y-1">
                          {c.teachers.map((t) => (
                            <div key={t.teacher_id ?? "_none"} className="text-[11.5px] text-ink-muted">
                              <strong className="text-ink">{t.teacher_name ?? "Chưa rõ GV"}</strong>
                              {" — "}
                              {t.class_sections.map((cs) => (
                                <span key={cs.id} className="mr-1.5">
                                  <code className="font-mono bg-surface px-1 rounded">{cs.code}</code>
                                  {" "}
                                  ({cs.enrolled_count}/{cs.max_students},{" "}
                                  {cs.schedules.map((s) =>
                                    `${WEEKDAY_LABELS[s.weekday]} t${s.start_period}-${s.end_period}`,
                                  ).join(", ")})
                                </span>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Chọn GV (chỉ hiển thị khi tick môn) */}
                      {checked && c.teachers.length > 0 && (
                        <div className="px-2 pb-2 pl-9">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11.5px] text-ink-muted">GV:</span>
                            <button
                              type="button"
                              onClick={() => setCourseTeacher(c.course_id, null)}
                              className={`px-2 py-0.5 rounded text-[11.5px] border ${
                                teacherId === null
                                  ? "bg-navy-600 text-white border-navy-600"
                                  : "bg-card border-line text-ink-muted hover:border-navy-400"
                              }`}
                            >
                              Tự chọn
                            </button>
                            {c.teachers
                              .filter((t) => t.teacher_id !== null)
                              .map((t) => (
                                <button
                                  key={t.teacher_id!}
                                  type="button"
                                  onClick={() => setCourseTeacher(c.course_id, t.teacher_id!)}
                                  className={`px-2 py-0.5 rounded text-[11.5px] border ${
                                    teacherId === t.teacher_id
                                      ? "bg-navy-600 text-white border-navy-600"
                                      : "bg-card border-line text-ink-muted hover:border-navy-400"
                                  }`}
                                >
                                  {t.teacher_name ?? `GV ${t.teacher_id}`}
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

            <label
              className={`flex items-start gap-3 rounded-md border px-3 py-3 cursor-pointer transition-colors ${
                optimizeFreeDays
                  ? "border-navy-600 bg-navy-50 ring-1 ring-navy-100"
                  : "border-line bg-card hover:border-navy-400"
              }`}
            >
              <input
                type="checkbox"
                checked={optimizeFreeDays}
                onChange={(e) => setOptimizeFreeDays(e.target.checked)}
                className="accent-navy-600 mt-0.5"
              />
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-ink">
                  TKB tối ưu (nghỉ nhiều ngày)
                </span>
                <span className="block text-[12px] text-ink-muted mt-0.5">
                  Khi bật, hệ thống ưu tiên gom lịch để tăng số ngày nghỉ trong tuần.
                </span>
              </span>
            </label>
          </div>
        </Card>

        {error && (
          <ErrorAlert message={error} details={errorDetails} />
        )}

        <div className="sticky bottom-0 bg-bg pt-3 pb-1 -mx-1 px-1 border-t border-line/60">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            icon="sparkle"
            className="w-full justify-center"
            disabled={searching || semesterStatus === "none" || selectedCourseIds.size === 0}
            title={
              semesterStatus === "none"
                ? "Chưa có học kỳ nào đang/sắp mở"
                : semesterStatus === "upcoming"
                  ? "Học kỳ sắp mở — bạn có thể tìm và xem trước, nhưng chưa thể áp dụng đăng ký."
                  : ""
            }
          >
            {searching
              ? "Đang tìm phương án..."
              : semesterStatus === "upcoming"
                ? "Tìm phương án (xem trước)"
                : "Tìm phương án"}
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

function ErrorAlert({ message, details }: { message: string; details?: string[] }) {
  return (
    <div className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">
      <div>{message}</div>
      {details && details.length > 0 && (
        <ul className="mt-2 space-y-1 list-disc pl-5 text-[12.5px] text-red-700">
          {details.map((detail, idx) => (
            <li key={`${idx}-${detail}`}>{detail}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SelectedInputSummary({
  semester,
  courses,
  avoidWeekdays,
  preferredSessions,
  optimizeFreeDays,
  lockedTeacherCount,
}: {
  semester: Semester | null;
  courses: SelectedCourseSummary[];
  avoidWeekdays: Set<number>;
  preferredSessions: Set<Session>;
  optimizeFreeDays: boolean;
  lockedTeacherCount: number;
}) {
  const avoidText = avoidWeekdays.size > 0
    ? Array.from(avoidWeekdays).sort().map(formatWeekday).join(", ")
    : "Không chọn";
  const sessionText = preferredSessions.size > 0
    ? Array.from(preferredSessions).map(sessionLabel).join(", ")
    : "Không chọn";

  return (
    <Card
      title="Thông tin đã chọn"
      subtitle="Các phương án bên dưới được tạo theo đúng cấu hình này."
      bodyClassName="p-4"
    >
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4">
        <div>
          <div className="text-[12.5px] font-medium text-ink mb-2">
            Môn học ({courses.length})
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {courses.map((course) => (
              <div key={course.id} className="rounded-md border border-line bg-surface px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-[12px] text-ink-muted flex-shrink-0">{course.code}</span>
                  <span className="font-semibold text-[13px] text-ink truncate">{course.name}</span>
                  {course.credits !== undefined && <Badge tone="accent">{course.credits} TC</Badge>}
                </div>
                <div className="mt-1 text-[11.5px] text-ink-muted">
                  GV: {course.teacherName}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-line bg-cardAlt px-3 py-2.5">
          <div className="text-[12.5px] font-medium text-ink mb-2">Cấu hình xếp lịch</div>
          <div className="space-y-2 text-[12.5px]">
            <SummaryLine label="Học kỳ" value={semester ? `${semester.code} - ${semester.name}` : "Chưa có"} />
            <SummaryLine
              label="Cách tính"
              value={optimizeFreeDays ? "TKB tối ưu (nghỉ nhiều ngày)" : "Tự động theo input đã chọn"}
            />
            <SummaryLine label="Tránh ngày" value={avoidText} />
            <SummaryLine label="Ưu tiên ca" value={sessionText} />
            <SummaryLine label="Khóa GV" value={lockedTeacherCount > 0 ? `${lockedTeacherCount} môn` : "Không khóa"} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-20 flex-shrink-0 text-ink-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}

function SemesterBanner({ semester, status }: { semester: Semester | null; status: SemesterStatus }) {
  if (!semester) return null;
  const isActive = status === "active";
  return (
    <div
      className={`rounded-md border px-3 py-2.5 flex items-start gap-3 ${
        isActive
          ? "bg-green-50 border-green-200"
          : "bg-amber-50 border-amber-200"
      }`}
    >
      <Icon
        name={isActive ? "check" : "clock"}
        size={18}
        className={`mt-0.5 flex-shrink-0 ${isActive ? "text-success" : "text-warn"}`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-[13.5px] text-ink">
            {semester.code} — {semester.name}
          </span>
          <Badge tone={isActive ? "success" : "warn"}>
            {isActive ? "Đang mở đăng ký" : "Sắp mở đăng ký"}
          </Badge>
        </div>
        <div className="text-[12px] text-ink-muted mt-0.5">
          {isActive
            ? `Cửa sổ đăng ký: ${formatRegistrationWindow(semester)}`
            : `Sẽ mở từ ${formatRegistrationWindow(semester)} — bạn có thể chuẩn bị trước nhưng chưa thể tìm phương án.`}
        </div>
      </div>
    </div>
  );
}

function CandidateCard({
  cand, rank, applyDisabled, applyDisabledReason, onDetail, onApply,
}: {
  cand: AutoScheduleCandidate;
  rank: number;
  applyDisabled?: boolean;
  applyDisabledReason?: string;
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
              Điểm {cand.score.toFixed(2)}
            </span>
            <span className="text-[12px] text-ink-muted">
              · {cand.class_sections.length} lớp · {cand.stats.study_days} ngày học / {cand.stats.free_days} ngày nghỉ
            </span>
          </div>
          <div className="mt-2 flex gap-3 text-[11.5px] text-ink-muted flex-wrap">
            <span>Ngày học: <strong className="text-ink">{cand.breakdown.weekday.toFixed(0)}</strong></span>
            <span>Ca học: <strong className="text-ink">{cand.breakdown.session.toFixed(0)}</strong></span>
            <span>Giáo viên: <strong className="text-ink">{cand.breakdown.teacher.toFixed(0)}</strong></span>
            <span>Ngày nghỉ: <strong className="text-ink">{cand.breakdown.free_day.toFixed(0)}</strong></span>
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
          <Button
            variant="primary"
            size="sm"
            icon="check"
            onClick={onApply}
            disabled={applyDisabled}
            title={applyDisabled ? applyDisabledReason : ""}
          >
            Áp dụng
          </Button>
        </div>
      </div>
    </Card>
  );
}

function BreakdownBars({ breakdown }: { breakdown: AutoScheduleCandidate["breakdown"] }) {
  const items: Array<[string, number]> = [
    [BREAKDOWN_LABELS.weekday, breakdown.weekday],
    [BREAKDOWN_LABELS.session, breakdown.session],
    [BREAKDOWN_LABELS.teacher, breakdown.teacher],
    [BREAKDOWN_LABELS.free_day, breakdown.free_day],
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
