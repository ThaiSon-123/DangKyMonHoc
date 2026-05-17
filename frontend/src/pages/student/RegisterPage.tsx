import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Modal, Stat, Table, type Column } from "@/components/ui";
import Icon from "@/components/ui/Icon";
import { listClassSections } from "@/api/classes";
import {
  cancelRegistration,
  createRegistration,
  listRegistrations,
  type Registration,
} from "@/api/registrations";
import { getMyCurriculum } from "@/api/curriculums";
import { listGrades } from "@/api/grades";
import { listSemesters } from "@/api/semesters";
import { extractApiError } from "@/lib/errors";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { formatRegistrationWindow, pickActiveSemester, type SemesterStatus } from "@/lib/semester";
import {
  SESSION_LABELS,
  WEEKDAY_LABELS,
  type ClassSection,
  type Curriculum,
  type Schedule,
  type Semester,
} from "@/types/domain";

export default function StudentRegisterPage() {
  // Auto-pick active hoặc upcoming semester (theo now). Không cho user chọn.
  const [semester, setSemester] = useState<Semester | null>(null);
  const [semesterStatus, setSemesterStatus] = useState<SemesterStatus>("none");
  const selectedSemester = semester?.id ?? "";
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [filterCurriculum, setFilterCurriculum] = useState(true);
  const [filterUnlearned, setFilterUnlearned] = useState(true);
  const [learnedCourseIds, setLearnedCourseIds] = useState<Set<number>>(new Set());

  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [expandedCourses, setExpandedCourses] = useState<Set<number>>(new Set());

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [regsLoading, setRegsLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [confirmTarget, setConfirmTarget] = useState<ClassSection | null>(null);
  const [retakeTarget, setRetakeTarget] = useState<ClassSection | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const [cancelTarget, setCancelTarget] = useState<Registration | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    listSemesters({ page_size: 1000 })
      .then((r) => {
        const result = pickActiveSemester(r.results);
        setSemester(result.semester);
        setSemesterStatus(result.status);
      })
      .catch((err) => showErrorToast(extractApiError(err, "Không tải được danh sách học kỳ.")));
  }, []);

  useEffect(() => {
    getMyCurriculum()
      .then(setCurriculum)
      .catch(() => setCurriculum(null));
  }, []);

  // Load grades → extract course_id mà SV đã có điểm (bất kể đậu/rớt)
  useEffect(() => {
    listGrades({ page_size: 1000 })
      .then((r) => {
        const ids = new Set<number>();
        for (const g of r.results) {
          if (g.total_score !== null && g.total_score !== "") {
            ids.add(g.course);
          }
        }
        setLearnedCourseIds(ids);
      })
      .catch(() => {
        // không có grade → bỏ qua
      });
  }, []);

  const refreshRegs = useCallback(async () => {
    if (!selectedSemester) {
      setRegistrations([]);
      return;
    }
    setRegsLoading(true);
    try {
      const data = await listRegistrations({
        semester: selectedSemester,
        page_size: 1000,
      });
      setRegistrations(data.results);
    } catch (err) {
      showErrorToast(extractApiError(err, "Không tải được danh sách đăng ký."));
    } finally {
      setRegsLoading(false);
    }
  }, [selectedSemester]);

  const refreshClasses = useCallback(async () => {
    if (!selectedSemester) {
      setClasses([]);
      return;
    }
    setClassesLoading(true);
    try {
      const data = await listClassSections({
        semester: selectedSemester,
        status: "OPEN",
        search: appliedSearch || undefined,
        curriculum: filterCurriculum ? curriculum?.id : undefined,
        page_size: 1000,
      });
      setClasses(data.results);
    } catch (err) {
      showErrorToast(extractApiError(err, "Không tải được danh sách lớp học phần."));
    } finally {
      setClassesLoading(false);
    }
  }, [selectedSemester, appliedSearch, filterCurriculum, curriculum?.id]);

  useEffect(() => {
    refreshRegs();
  }, [refreshRegs]);

  useEffect(() => {
    refreshClasses();
  }, [refreshClasses]);

  function applySearch() {
    setAppliedSearch(search);
  }

  function toggleCourseExpand(courseId: number) {
    const next = new Set(expandedCourses);
    if (next.has(courseId)) next.delete(courseId);
    else next.add(courseId);
    setExpandedCourses(next);
  }

  // Group lớp HP theo môn + apply filter "Chỉ chưa học"
  const courseGroups = useMemo(() => {
    interface Group {
      course_id: number;
      course_code: string;
      course_name: string;
      course_credits: number;
      is_learned: boolean;
      sections: ClassSection[];
    }
    const map = new Map<number, Group>();
    for (const cs of classes) {
      if (filterUnlearned && learnedCourseIds.has(cs.course)) continue;
      let g = map.get(cs.course);
      if (!g) {
        g = {
          course_id: cs.course,
          course_code: cs.course_code,
          course_name: cs.course_name,
          course_credits: cs.course_credits,
          is_learned: learnedCourseIds.has(cs.course),
          sections: [],
        };
        map.set(cs.course, g);
      }
      g.sections.push(cs);
    }
    return Array.from(map.values()).sort((a, b) => a.course_code.localeCompare(b.course_code));
  }, [classes, filterUnlearned, learnedCourseIds]);

  const totalSectionsAfterFilter = courseGroups.reduce((s, g) => s + g.sections.length, 0);

  const registeredClassIds = useMemo(
    () =>
      new Set(
        registrations
          .filter((r) => r.status === "PENDING" || r.status === "CONFIRMED")
          .map((r) => r.class_section),
      ),
    [registrations],
  );

  async function submitRegistration(target: ClassSection, retakeConfirmed = false) {
    setSubmitting(true);
    setRegisterError(null);
    try {
      await createRegistration({
        class_section: target.id,
        retake_confirmed: retakeConfirmed,
      });
      showSuccessToast(`Đã đăng ký thành công lớp ${target.code}.`, "Đăng ký thành công");
      setConfirmTarget(null);
      setRetakeTarget(null);
      await Promise.all([refreshRegs(), refreshClasses()]);
    } catch (err) {
      const message = extractApiError(err);
      if (message.includes("Môn đã học rồi") && !retakeConfirmed) {
        setConfirmTarget(null);
        setRetakeTarget(target);
      } else {
        setRegisterError(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!cancelTarget) return;
    setSubmitting(true);
    try {
      await cancelRegistration(cancelTarget.id, cancelReason || "SV tự huỷ");
      showSuccessToast(`Đã huỷ đăng ký lớp ${cancelTarget.class_section_code}.`, "Huỷ đăng ký thành công");
      setCancelTarget(null);
      setCancelReason("");
      await Promise.all([refreshRegs(), refreshClasses()]);
    } catch (err) {
      showErrorToast(extractApiError(err, "Không huỷ được đăng ký."));
    } finally {
      setSubmitting(false);
    }
  }

  function formatSchedules(schedules: Schedule[]): string {
    if (schedules.length === 0) return "Chưa có lịch";
    return schedules
      .map(
        (s) =>
          `${WEEKDAY_LABELS[s.weekday]} ${SESSION_LABELS[s.session].split(" (")[0]} tiết ${s.start_period}-${s.end_period}${s.room ? " · " + s.room : ""}`,
      )
      .join(" / ");
  }

  const activeRegistrations = registrations.filter((r) => r.status !== "CANCELLED");
  const totalRegistered = activeRegistrations.filter(
    (r) => r.status === "CONFIRMED" || r.status === "PENDING",
  ).length;
  const totalCredits = activeRegistrations
    .filter((r) => r.status === "CONFIRMED" || r.status === "PENDING")
    .reduce((s, r) => s + r.course_credits, 0);

  const semesterObj = semester;
  const isSemesterOpen = semesterStatus === "active";

  const classColumns: Column<ClassSection>[] = [
    { key: "code", label: "Mã lớp", mono: true, width: "120px" },
    {
      key: "teacher",
      label: "Giáo viên",
      width: "160px",
      render: (c) =>
        c.teacher_name ? (
          <span className="text-[12.5px]">{c.teacher_name}</span>
        ) : (
          <span className="text-ink-faint">— chưa gán —</span>
        ),
    },
    {
      key: "schedules",
      label: "Lịch học",
      render: (c) => (
        <span className="text-[12px] text-ink-muted">{formatSchedules(c.schedules)}</span>
      ),
    },
    {
      key: "enrollment",
      label: "Sĩ số",
      align: "center",
      width: "100px",
      render: (c) => (
        <div>
          <span className={`font-mono text-[12.5px] ${c.is_full ? "text-danger font-semibold" : "text-ink"}`}>
            {c.enrolled_count}/{c.max_students}
          </span>
          {c.is_full && <Badge tone="danger">Đầy</Badge>}
        </div>
      ),
    },
    {
      key: "actions",
      label: "",
      width: "120px",
      align: "right",
      render: (c) => {
        const isRegistered = registeredClassIds.has(c.id);
        if (isRegistered) {
          return <Badge tone="success">Đã đăng ký</Badge>;
        }
        return (
          <Button
            size="sm"
            variant="primary"
            icon="plus"
            onClick={() => {
              if (!isSemesterOpen) {
                showErrorToast("Học kỳ này đang ngoài thời gian đăng ký.");
                return;
              }
              setConfirmTarget(c);
              setRegisterError(null);
            }}
            disabled={c.is_full}
            className={!isSemesterOpen ? "opacity-60" : ""}
            title={
              !isSemesterOpen
                ? "Ngoài thời gian đăng ký"
                : c.is_full
                ? "Lớp đã đầy"
                : ""
            }
          >
            Đăng ký
          </Button>
        );
      },
    },
  ];

  const registeredColumns: Column<Registration>[] = [
    { key: "class_section_code", label: "Mã lớp", mono: true, width: "120px" },
    {
      key: "course",
      label: "Môn học",
      render: (r) => (
        <div>
          <div className="font-mono text-[12px] text-ink-muted">{r.course_code}</div>
          <div className="text-[13px]">{r.course_name}</div>
        </div>
      ),
    },
    {
      key: "course_credits",
      label: "TC",
      align: "center",
      width: "60px",
      render: (r) => <span className="font-mono">{r.course_credits}</span>,
    },
    {
      key: "teacher_name",
      label: "Giáo viên",
      width: "160px",
      render: (r) => r.teacher_name || <span className="text-ink-faint">—</span>,
    },
    {
      key: "schedules",
      label: "Lịch học",
      render: (r) => (
        <span className="text-[12px] text-ink-muted">{formatSchedules(r.schedules ?? [])}</span>
      ),
    },
    {
      key: "enrollment",
      label: "Sĩ số",
      align: "center",
      width: "100px",
      render: (r) => (
        <span className="font-mono text-[12.5px]">
          {r.enrolled_count}/{r.max_students}
        </span>
      ),
    },
    {
      key: "status",
      label: "Trạng thái",
      width: "120px",
      render: (r) => (
        <Badge tone={r.status === "CONFIRMED" ? "success" : "warn"}>{r.status_display}</Badge>
      ),
    },
    {
      key: "actions",
      label: "",
      width: "90px",
      align: "right",
      render: (r) => (
        <Button
          size="sm"
          variant="ghost"
          icon="x"
          onClick={() => {
            setCancelTarget(r);
            setCancelReason("");
          }}
          disabled={!isSemesterOpen}
        >
          Huỷ
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h1 className="m-0 text-[22px] font-semibold tracking-tight text-ink">
            Đăng ký môn học
          </h1>
        </div>
        <div
          className={`px-3 py-2 rounded-md border text-[13px] min-w-[320px] ${
            semesterStatus === "active"
              ? "bg-green-50 border-green-200"
              : semesterStatus === "upcoming"
                ? "bg-amber-50 border-amber-200"
                : "bg-card border-line"
          }`}
        >
          {semesterObj ? (
            <div className="flex flex-col">
              <span className="font-semibold text-ink">
                {semesterObj.code} — {semesterObj.name}
              </span>
              <span className="text-[11.5px] text-ink-muted">
                {semesterStatus === "active"
                  ? `Đang mở · ${formatRegistrationWindow(semesterObj)}`
                  : `Sắp mở · ${formatRegistrationWindow(semesterObj)}`}
              </span>
            </div>
          ) : (
            <span className="text-ink-faint">Không có học kỳ nào đang/sắp mở đăng ký</span>
          )}
        </div>
      </div>

      {semesterStatus === "upcoming" && semesterObj && (
        <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-[13px] text-warn flex items-start gap-2">
          <Icon name="clock" size={16} className="mt-0.5 flex-shrink-0" />
          <div>
            Học kỳ <strong>{semesterObj.code}</strong> sắp mở từ{" "}
            <strong>{formatRegistrationWindow(semesterObj)}</strong>. Bạn có thể xem trước danh sách lớp HP, nhưng chưa thể đăng ký.
          </div>
        </div>
      )}
      {semesterStatus === "none" && (
        <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-[13px] text-warn flex items-start gap-2">
          <Icon name="bell" size={16} className="mt-0.5 flex-shrink-0" />
          <div>Hiện chưa có học kỳ nào đang mở hoặc sắp mở đăng ký. Vui lòng quay lại sau.</div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Lớp đã đăng ký" value={totalRegistered} icon="check" tone="accent" />
        <Stat label="Tổng tín chỉ" value={totalCredits} icon="book" />
        <Stat label="Môn khả dụng" value={courseGroups.length} icon="clipboard" />
      </div>

      <Card
        title="Lớp học phần mở"
        subtitle={`Nhóm theo môn · ${courseGroups.length} môn · ${totalSectionsAfterFilter} lớp HP`}
      >
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface border border-line w-80">
            <Icon name="search" size={15} className="text-ink-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
              placeholder="Tìm theo mã lớp / mã môn / tên môn…"
              className="flex-1 bg-transparent outline-none text-[13px] min-w-0"
            />
          </div>
          <Button onClick={applySearch}>Tìm</Button>
          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface border border-line text-[13px]">
            <input
              type="checkbox"
              checked={filterCurriculum}
              onChange={(e) => setFilterCurriculum(e.target.checked)}
            />
            Theo CTĐT
          </label>
          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface border border-line text-[13px]">
            <input
              type="checkbox"
              checked={filterUnlearned}
              onChange={(e) => setFilterUnlearned(e.target.checked)}
            />
            Chỉ môn chưa học
          </label>
          {(appliedSearch || !filterCurriculum || !filterUnlearned) && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("");
                setAppliedSearch("");
                setFilterCurriculum(true);
                setFilterUnlearned(true);
              }}
            >
              Đặt lại filter
            </Button>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedCourses(new Set(courseGroups.map((g) => g.course_id)))}
            >
              Mở tất cả
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedCourses(new Set())}
            >
              Thu gọn
            </Button>
          </div>
        </div>

        {classesLoading ? (
          <div className="text-ink-muted py-6 text-center">Đang tải...</div>
        ) : courseGroups.length === 0 ? (
          <div className="text-ink-faint py-12 text-center text-[13px]">
            {filterUnlearned
              ? "Không có môn nào chưa học khả dụng trong học kỳ này."
              : "Không có lớp học phần nào mở."}
          </div>
        ) : (
          <div className="space-y-1.5">
            {courseGroups.map((g) => {
              const isExpanded = expandedCourses.has(g.course_id);
              return (
                <div key={g.course_id} className="border border-line rounded-md bg-card overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleCourseExpand(g.course_id)}
                    className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-surface text-left"
                  >
                    <Icon
                      name={isExpanded ? "chevronDown" : "chevronRight"}
                      size={14}
                      className="text-ink-muted flex-shrink-0"
                    />
                    <span className="font-mono text-[12.5px] text-ink-muted w-20 flex-shrink-0">
                      {g.course_code}
                    </span>
                    <span className="flex-1 truncate text-[13px] font-medium text-ink">
                      {g.course_name}
                    </span>
                    {g.is_learned && <Badge tone="neutral">Đã học</Badge>}
                    <Badge tone="accent">{g.course_credits} TC</Badge>
                    <span className="text-[11.5px] text-ink-muted w-16 text-right">
                      {g.sections.length} lớp
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-line">
                      <Table
                        columns={classColumns}
                        rows={g.sections}
                        rowKey={(c) => c.id}
                        emptyText=""
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card title="Lớp đã đăng ký" subtitle={`${totalRegistered} lớp · ${totalCredits} tín chỉ`}>
        <Table
          columns={registeredColumns}
          rows={activeRegistrations}
          rowKey={(r) => r.id}
          loading={regsLoading}
          emptyText="Chưa có lớp học phần đã đăng ký."
        />
      </Card>

      <Modal
        open={confirmTarget !== null}
        title="Xác nhận đăng ký môn"
        subtitle={confirmTarget ? `${confirmTarget.course_code} - ${confirmTarget.course_name}` : ""}
        onClose={() => setConfirmTarget(null)}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmTarget(null)}>
              Huỷ bỏ
            </Button>
            <Button
              variant="primary"
              onClick={() => confirmTarget && submitRegistration(confirmTarget)}
              disabled={submitting}
              icon="check"
            >
              {submitting ? "Đang đăng ký..." : "Xác nhận đăng ký"}
            </Button>
          </>
        }
      >
        {confirmTarget && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <InfoItem label="Mã lớp" value={confirmTarget.code} mono />
              <InfoItem label="Tín chỉ" value={`${confirmTarget.course_credits}`} mono />
              <InfoItem label="Giáo viên" value={confirmTarget.teacher_name || "Chưa gán"} />
              <InfoItem label="Sĩ số" value={`${confirmTarget.enrolled_count}/${confirmTarget.max_students}`} mono />
            </div>
            {confirmTarget.schedules.length > 0 && (
              <div className="bg-surface rounded-md px-3 py-2">
                <div className="text-[11.5px] text-ink-muted uppercase tracking-wider font-semibold mb-1">
                  Lịch học
                </div>
                {confirmTarget.schedules.map((s) => (
                  <div key={s.id} className="text-[12.5px] text-ink">
                    {WEEKDAY_LABELS[s.weekday]} · {SESSION_LABELS[s.session].split(" (")[0]} tiết {s.start_period}-{s.end_period}
                    {s.room && ` · Phòng ${s.room}`}
                  </div>
                ))}
              </div>
            )}
            {registerError && (
              <div className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {registerError}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={retakeTarget !== null}
        title="Môn đã học rồi"
        subtitle={retakeTarget ? `${retakeTarget.course_code} - ${retakeTarget.course_name}` : ""}
        onClose={() => setRetakeTarget(null)}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRetakeTarget(null)}>
              Không
            </Button>
            <Button
              variant="primary"
              onClick={() => retakeTarget && submitRegistration(retakeTarget, true)}
              disabled={submitting}
            >
              Có, học lại
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-ink">
          Môn này đã có điểm trong bảng điểm. Bạn có muốn học lại không?
        </p>
      </Modal>

      <Modal
        open={cancelTarget !== null}
        title="Huỷ đăng ký môn"
        subtitle={cancelTarget ? `${cancelTarget.course_code} · ${cancelTarget.class_section_code}` : ""}
        onClose={() => setCancelTarget(null)}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelTarget(null)}>
              Đóng
            </Button>
            <Button variant="danger" onClick={handleCancel} disabled={submitting}>
              {submitting ? "Đang huỷ..." : "Xác nhận huỷ"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-[13px] text-ink">
            Huỷ đăng ký môn này? Bạn chỉ được huỷ khi học kỳ còn trong thời gian đăng ký.
          </p>
          <label className="block">
            <div className="text-[12.5px] font-medium text-ink mb-1.5">Lý do (tuỳ chọn)</div>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={2}
              placeholder="Vd: Đổi nguyện vọng..."
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none resize-y"
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}

function InfoItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-[11.5px] text-ink-muted uppercase tracking-wider font-semibold mb-0.5">
        {label}
      </div>
      <div className={`text-[13.5px] text-ink ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
