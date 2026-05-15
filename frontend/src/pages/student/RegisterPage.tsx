import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Modal, Pagination, Stat, Table, type Column } from "@/components/ui";
import Icon from "@/components/ui/Icon";
import { listClassSections } from "@/api/classes";
import {
  cancelRegistration,
  createRegistration,
  listRegistrations,
  type Registration,
} from "@/api/registrations";
import { getMyCurriculum } from "@/api/curriculums";
import { listSemesters } from "@/api/semesters";
import { extractApiError } from "@/lib/errors";
import { PAGE_SIZE } from "@/lib/constants";
import {
  SESSION_LABELS,
  WEEKDAY_LABELS,
  type ClassSection,
  type Curriculum,
  type Schedule,
  type Semester,
} from "@/types/domain";

export default function StudentRegisterPage() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<number | "">("");
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [filterCurriculum, setFilterCurriculum] = useState(true);
  const [filterOpenSemester, setFilterOpenSemester] = useState(false);

  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classesTotal, setClassesTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [regsLoading, setRegsLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [confirmTarget, setConfirmTarget] = useState<ClassSection | null>(null);
  const [retakeTarget, setRetakeTarget] = useState<ClassSection | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);

  const [cancelTarget, setCancelTarget] = useState<Registration | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    listSemesters({ page_size: 1000 })
      .then((r) => {
        setSemesters(r.results);
        setSelectedSemester(r.results[0]?.id ?? "");
      })
      .catch((err) => setError(extractApiError(err, "Không tải được học kỳ.")));
  }, []);

  useEffect(() => {
    getMyCurriculum()
      .then(setCurriculum)
      .catch(() => setCurriculum(null));
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
      setError(extractApiError(err, "Không tải được đăng ký."));
    } finally {
      setRegsLoading(false);
    }
  }, [selectedSemester]);

  const refreshClasses = useCallback(async () => {
    if (!selectedSemester) {
      setClasses([]);
      setClassesTotal(0);
      return;
    }
    if (filterOpenSemester && !semesters.find((s) => s.id === selectedSemester)?.is_open) {
      setClasses([]);
      setClassesTotal(0);
      return;
    }
    setClassesLoading(true);
    setError(null);
    try {
      const data = await listClassSections({
        semester: selectedSemester,
        status: "OPEN",
        search: appliedSearch || undefined,
        curriculum: filterCurriculum ? curriculum?.id : undefined,
        page,
      });
      setClasses(data.results);
      setClassesTotal(data.count);
    } catch (err) {
      setError(extractApiError(err, "Không tải được lớp học phần."));
    } finally {
      setClassesLoading(false);
    }
  }, [selectedSemester, appliedSearch, filterCurriculum, filterOpenSemester, semesters, curriculum?.id, page]);

  useEffect(() => {
    refreshRegs();
  }, [refreshRegs]);

  useEffect(() => {
    refreshClasses();
  }, [refreshClasses]);

  function applySearch() {
    setPage(1);
    setAppliedSearch(search);
  }

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
      setRegisterSuccess(`Đăng ký thành công ${target.code}!`);
      setConfirmTarget(null);
      setRetakeTarget(null);
      await Promise.all([refreshRegs(), refreshClasses()]);
      setTimeout(() => setRegisterSuccess(null), 4000);
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
      setCancelTarget(null);
      setCancelReason("");
      await Promise.all([refreshRegs(), refreshClasses()]);
    } catch (err) {
      setError(extractApiError(err, "Không huỷ được đăng ký."));
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

  const semesterObj = semesters.find((s) => s.id === selectedSemester);
  const isSemesterOpen = semesterObj?.is_open ?? false;

  const classColumns: Column<ClassSection>[] = [
    { key: "code", label: "Mã lớp", mono: true, width: "120px" },
    {
      key: "course",
      label: "Môn học",
      render: (c) => (
        <div>
          <div className="font-mono text-[12px] text-ink-muted">{c.course_code}</div>
          <div className="text-[13px]">{c.course_name}</div>
        </div>
      ),
    },
    {
      key: "course_credits",
      label: "TC",
      align: "center",
      width: "60px",
      render: (c) => <span className="font-mono">{c.course_credits}</span>,
    },
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
                setError("Ngoài thời gian đăng ký.");
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
        <div className="px-3 py-2 rounded-md bg-card border border-line text-[13px] min-w-[280px]">
          {semesterObj ? (
            <span>
              {semesterObj.code} - {semesterObj.name}
              {semesterObj.is_open ? " (đang mở)" : " (chưa mở)"}
            </span>
          ) : (
            <span className="text-ink-faint">Chưa có học kỳ</span>
          )}
        </div>
      </div>

      {!isSemesterOpen && selectedSemester && (
        <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-[13px] text-warn flex items-start gap-2">
          <Icon name="bell" size={16} className="mt-0.5 flex-shrink-0" />
          <div>Ngoài thời gian đăng ký. Bạn có thể xem danh sách lớp nhưng chưa thể đăng ký mới.</div>
        </div>
      )}

      {registerSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-md px-3 py-2 text-[13px] text-success flex items-start gap-2">
          <Icon name="check" size={16} className="mt-0.5 flex-shrink-0" />
          <div>{registerSuccess}</div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Lớp đã đăng ký" value={totalRegistered} icon="check" tone="accent" />
        <Stat label="Tổng tín chỉ" value={totalCredits} icon="book" />
        <Stat label="Lớp mở kỳ mới nhất" value={classesTotal} icon="clipboard" />
      </div>

      <Card title="Lớp học phần mở" subtitle="Chỉ hiển thị lớp thuộc học kỳ mới nhất">
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
              onChange={(e) => {
                setFilterCurriculum(e.target.checked);
                setPage(1);
              }}
            />
            Theo CTĐT
          </label>
          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface border border-line text-[13px]">
            <input
              type="checkbox"
              checked={filterOpenSemester}
              onChange={(e) => {
                setFilterOpenSemester(e.target.checked);
                setPage(1);
              }}
            />
            Kỳ đang mở
          </label>
          {(appliedSearch || !filterCurriculum || filterOpenSemester) && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("");
                setAppliedSearch("");
                setFilterCurriculum(true);
                setFilterOpenSemester(false);
                setPage(1);
              }}
            >
              Xoá filter
            </Button>
          )}
        </div>

        {error && (
          <div className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-3">
            {error}
          </div>
        )}

        <Table
          columns={classColumns}
          rows={classes}
          rowKey={(c) => c.id}
          loading={classesLoading}
          emptyText="Không có lớp học phần nào mở trong học kỳ mới nhất."
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={classesTotal} onChange={setPage} />
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
