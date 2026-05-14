import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, Modal, Pagination, Table, type Column } from "@/components/ui";
import Icon from "@/components/ui/Icon";
import {
  createClassSection,
  deleteClassSection,
  listClassSections,
  updateClassSection,
  type ClassSectionInput,
  type ScheduleInput,
} from "@/api/classes";
import { listCourses } from "@/api/courses";
import { listSemesters } from "@/api/semesters";
import { listTeachers } from "@/api/teachers";
import { extractApiError } from "@/lib/errors";
import { showErrorToast } from "@/lib/toast";
import { PAGE_SIZE } from "@/lib/constants";
import {
  CLASS_STATUS_LABELS,
  SESSION_LABELS,
  SESSION_PERIODS,
  WEEKDAY_LABELS,
  type ClassSection,
  type ClassStatus,
  type Course,
  type Semester,
  type SessionType,
  type TeacherProfile,
  type Weekday,
} from "@/types/domain";

const EMPTY: ClassSectionInput = {
  code: "",
  course: 0,
  semester: 0,
  teacher: null,
  periods_per_session: 3,
  max_students: 50,
  status: "CLOSED",
  note: "",
};

const EMPTY_SCHEDULE: Omit<ScheduleInput, "class_section"> = {
  weekday: 0,
  session: "MORNING",
  start_period: 1,
  room: "",
  start_date: null,
  end_date: null,
};

const STATUS_TONE: Record<ClassStatus, "neutral" | "success" | "warn" | "danger"> = {
  DRAFT: "neutral",
  OPEN: "success",
  CLOSED: "warn",
  CANCELLED: "danger",
};

const EDITABLE_CLASS_STATUSES: ClassStatus[] = ["OPEN", "CLOSED", "CANCELLED"];

export default function ClassesPage() {
  const [items, setItems] = useState<ClassSection[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [filterSemester, setFilterSemester] = useState<number | "">("");
  const [filterStatus, setFilterStatus] = useState<ClassStatus | "">("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<ClassSection | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ClassSectionInput>(EMPTY);
  const [scheduleForm, setScheduleForm] =
    useState<Omit<ScheduleInput, "class_section">>(EMPTY_SCHEDULE);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<ClassSection | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Parameters<typeof listClassSections>[0] = { page };
      if (appliedSearch) params.search = appliedSearch;
      if (filterSemester) params.semester = filterSemester;
      if (filterStatus) params.status = filterStatus;
      const data = await listClassSections(params);
      setItems(data.results);
      setTotal(data.count);
    } catch (err) {
      setError(extractApiError(err, "Không tải được danh sách lớp."));
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, filterSemester, filterStatus, page]);

  useEffect(() => {
    // Fetch full list cho dropdown (page_size lớn)
    listCourses({ page_size: 1000 }).then((r) => setCourses(r.results));
    listSemesters({ page: 1 }).then((r) => setSemesters(r.results));
    listTeachers({ page_size: 1000 }).then((r) => setTeachers(r.results));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function applyFilters() {
    setPage(1);
    setAppliedSearch(search);
  }

  function openCreate() {
    setEditing(null);
    const defaultSemester = semesters.find((s) => s.is_open)?.id ?? semesters[0]?.id ?? 0;
    setForm({ ...EMPTY, semester: defaultSemester, course: courses[0]?.id ?? 0 });
    setScheduleForm(EMPTY_SCHEDULE);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(cs: ClassSection) {
    setEditing(cs);
    setForm({
      code: cs.code,
      course: cs.course,
      semester: cs.semester,
      teacher: cs.teacher,
      periods_per_session: cs.periods_per_session,
      max_students: cs.max_students,
      status: cs.status,
      note: cs.note,
    });
    if (cs.status === "DRAFT") {
      setForm((current) => ({ ...current, status: "CLOSED" }));
    }
    const firstSchedule = cs.schedules[0] ?? null;
    setScheduleForm(
      firstSchedule
        ? {
            weekday: firstSchedule.weekday,
            session: firstSchedule.session,
            start_period: firstSchedule.start_period,
            room: firstSchedule.room,
            start_date: firstSchedule.start_date,
            end_date: firstSchedule.end_date,
          }
        : EMPTY_SCHEDULE,
    );
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const primary_schedule: Omit<ScheduleInput, "class_section"> = {
        weekday: scheduleForm.weekday,
        session: scheduleForm.session,
        start_period: scheduleForm.start_period,
        room: scheduleForm.room,
        start_date: scheduleForm.start_date || null,
        end_date: scheduleForm.end_date || null,
      };
      const payload: ClassSectionInput = { ...form, primary_schedule };
      if (editing) await updateClassSection(editing.id, payload);
      else await createClassSection(payload);
      setShowForm(false);
      await refresh();
    } catch (err) {
      const message = extractApiError(err);
      setFormError(message);
      showErrorToast(message, "Không lưu được lớp học phần");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteClassSection(deleteTarget.id);
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      setError(extractApiError(err, "Không xoá được lớp."));
      setDeleteTarget(null);
    }
  }

  const [sessionStart, sessionEnd] = SESSION_PERIODS[scheduleForm.session];
  const maxStartPeriod = Math.min(
    sessionEnd,
    sessionEnd - form.periods_per_session + 1,
  );
  const validStartPeriods = Array.from(
    { length: Math.max(0, maxStartPeriod - sessionStart + 1) },
    (_, i) => sessionStart + i,
  );

  const columns: Column<ClassSection>[] = [
    {
      key: "code",
      label: "Mã lớp",
      mono: true,
      width: "120px",
      render: (cs) => (
        <Link to={`/admin/classes/${cs.id}`} className="text-navy-600 hover:underline">
          {cs.code}
        </Link>
      ),
    },
    {
      key: "course",
      label: "Môn học",
      render: (cs) => (
        <div>
          <div className="font-mono text-[12px] text-ink-muted">{cs.course_code}</div>
          <div className="text-[13px]">{cs.course_name}</div>
        </div>
      ),
    },
    { key: "semester_code", label: "Học kỳ", mono: true, width: "140px" },
    {
      key: "teacher",
      label: "Giáo viên",
      width: "180px",
      render: (cs) =>
        cs.teacher_name ? (
          <div>
            <div className="text-[13px]">{cs.teacher_name}</div>
            <div className="font-mono text-[11.5px] text-ink-faint">{cs.teacher_code}</div>
          </div>
        ) : (
          <span className="text-ink-faint">— chưa gán —</span>
        ),
    },
    {
      key: "enrollment",
      label: "Sĩ số",
      align: "center",
      width: "100px",
      render: (cs) => (
        <span
          className={`font-mono ${cs.is_full ? "text-danger font-semibold" : "text-ink"}`}
        >
          {cs.enrolled_count}/{cs.max_students}
        </span>
      ),
    },
    {
      key: "primary_schedule",
      label: "Lịch chính",
      width: "220px",
      render: (cs) => {
        const firstSchedule = cs.schedules[0];
        if (!firstSchedule) return <Badge tone="warn">Chưa có</Badge>;
        return (
          <div className="space-y-1">
            <div className="text-[13px] text-ink">
              {WEEKDAY_LABELS[firstSchedule.weekday]} ·{" "}
              {SESSION_LABELS[firstSchedule.session].split(" (")[0]} · tiết{" "}
              {firstSchedule.start_period}-{firstSchedule.end_period}
            </div>
            <div className="font-mono text-[11.5px] text-ink-faint">
              {firstSchedule.start_date || "?"} → {firstSchedule.end_date || "?"}
            </div>
          </div>
        );
      },
    },
    {
      key: "schedules",
      label: "Lịch",
      width: "80px",
      align: "center",
      render: (cs) =>
        cs.schedules.length === 0 ? (
          <Badge tone="warn">Chưa có</Badge>
        ) : (
          <Badge tone="accent">{cs.schedules.length} buổi</Badge>
        ),
    },
    {
      key: "status",
      label: "Trạng thái",
      width: "110px",
      render: (cs) => <Badge tone={STATUS_TONE[cs.status]}>{cs.status_display}</Badge>,
    },
    {
      key: "actions",
      label: "",
      width: "150px",
      align: "right",
      render: (cs) => (
        <div className="flex justify-end gap-1">
          <Link to={`/admin/classes/${cs.id}`}>
            <Button size="sm" variant="ghost" icon="calendar">
              Lịch
            </Button>
          </Link>
          <Button size="sm" variant="ghost" icon="edit" onClick={() => openEdit(cs)}>
            Sửa
          </Button>
          <Button size="sm" variant="ghost" icon="trash" onClick={() => setDeleteTarget(cs)}>
            Xoá
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h1 className="m-0 text-[22px] font-semibold tracking-tight text-ink">
            Lớp học phần
          </h1>
          <p className="mt-1 text-[13.5px] text-ink-muted">
            Tạo lớp cho từng môn học theo học kỳ, gán giáo viên, thiết lập sĩ số và lịch học.
          </p>
        </div>
        <Button variant="primary" icon="plus" onClick={openCreate}>
          Thêm lớp
        </Button>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface border border-line w-72">
            <Icon name="search" size={15} className="text-ink-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyFilters();
              }}
              placeholder="Tìm theo mã lớp / mã môn…"
              className="flex-1 bg-transparent outline-none text-[13px] min-w-0"
            />
          </div>
          <select
            value={filterSemester}
            onChange={(e) => {
              setFilterSemester(e.target.value === "" ? "" : Number(e.target.value));
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-md bg-surface border border-line text-[13px]"
          >
            <option value="">Tất cả học kỳ</option>
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value as ClassStatus | "");
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-md bg-surface border border-line text-[13px]"
          >
            <option value="">Tất cả trạng thái</option>
            {EDITABLE_CLASS_STATUSES.map((status) => (
              <option key={status} value={status}>
                {CLASS_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <Button onClick={applyFilters}>Tìm</Button>
          {(appliedSearch || filterSemester !== "" || filterStatus !== "") && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("");
                setAppliedSearch("");
                setFilterSemester("");
                setFilterStatus("");
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
          columns={columns}
          rows={items}
          rowKey={(cs) => cs.id}
          loading={loading}
          emptyText="Chưa có lớp học phần nào. Bấm 'Thêm lớp' để bắt đầu."
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
      </Card>

      <Modal
        open={showForm}
        title={editing ? `Sửa lớp: ${editing.code}` : "Thêm lớp học phần"}
        onClose={() => setShowForm(false)}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Huỷ
            </Button>
            <Button variant="primary" type="submit" form="class-form" disabled={submitting}>
              {submitting ? "Đang lưu..." : "Lưu"}
            </Button>
          </>
        }
      >
        <form id="class-form" onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Mã lớp *</Label>
            <input
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="CS101.01"
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] font-mono focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            />
          </div>
          <div>
            <Label>Môn học *</Label>
            <select
              required
              value={form.course}
              onChange={(e) => setForm({ ...form, course: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            >
              <option value={0}>-- chọn môn --</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Học kỳ *</Label>
            <select
              required
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            >
              <option value={0}>-- chọn học kỳ --</option>
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name}
                  {s.is_open ? " (đang mở)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <Label>Giáo viên phụ trách</Label>
            <select
              value={form.teacher ?? ""}
              onChange={(e) =>
                setForm({ ...form, teacher: e.target.value === "" ? null : Number(e.target.value) })
              }
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            >
              <option value="">— Chưa gán giáo viên —</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.teacher_code} - {t.full_name}
                  {t.title ? ` (${t.title})` : ""}
                </option>
              ))}
            </select>
            <div className="text-[11.5px] text-ink-faint mt-1">
              Bắt buộc phải gán giáo viên khi đặt trạng thái "Đang mở".
            </div>
          </div>
          <div>
            <Label>Số tiết / buổi *</Label>
            <input
              required
              type="number"
              min={1}
              max={5}
              value={form.periods_per_session}
              onChange={(e) =>
                setForm({ ...form, periods_per_session: Number(e.target.value) })
              }
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            />
            <div className="text-[11.5px] text-ink-faint mt-1">
              Mỗi buổi học bao nhiêu tiết liên tiếp (1-5).
            </div>
          </div>
          <div>
            <Label>Sĩ số tối đa *</Label>
            <input
              required
              type="number"
              min={1}
              max={500}
              value={form.max_students}
              onChange={(e) => setForm({ ...form, max_students: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            />
          </div>
          <div className="col-span-2">
            <Label>Trạng thái *</Label>
            <select
              required
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as ClassStatus })}
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            >
              {EDITABLE_CLASS_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {CLASS_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2 rounded-md border border-line bg-surface p-3">
            <div className="text-[12.5px] font-semibold text-ink mb-2">Lịch học chính</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Học thứ mấy *</Label>
                <select
                  required
                  value={scheduleForm.weekday}
                  onChange={(e) =>
                    setScheduleForm({
                      ...scheduleForm,
                      weekday: Number(e.target.value) as Weekday,
                    })
                  }
                  className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
                >
                  {Object.entries(WEEKDAY_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Buổi học *</Label>
                <select
                  required
                  value={scheduleForm.session}
                  onChange={(e) => {
                    const newSession = e.target.value as SessionType;
                    const [start] = SESSION_PERIODS[newSession];
                    setScheduleForm({
                      ...scheduleForm,
                      session: newSession,
                      start_period: start,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
                >
                  {Object.entries(SESSION_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Tiết bắt đầu *</Label>
                <select
                  required
                  value={scheduleForm.start_period}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, start_period: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
                >
                  {validStartPeriods.map((p) => (
                    <option key={p} value={p}>
                      Tiết {p} (đến tiết {p + form.periods_per_session - 1})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Phòng học</Label>
                <input
                  value={scheduleForm.room}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, room: e.target.value })}
                  placeholder="B4.12"
                  className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
                />
              </div>
              <div>
                <Label>Ngày bắt đầu học *</Label>
                <input
                  required
                  type="date"
                  value={scheduleForm.start_date ?? ""}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, start_date: e.target.value || null })
                  }
                  className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
                />
              </div>
              <div>
                <Label>Ngày kết thúc học *</Label>
                <input
                  required
                  type="date"
                  value={scheduleForm.end_date ?? ""}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, end_date: e.target.value || null })
                  }
                  className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
                />
              </div>
            </div>
          </div>
          <div className="col-span-2">
            <Label>Ghi chú (không bắt buộc)</Label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows={2}
              placeholder="Ghi chú thêm về lớp học phần..."
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none resize-y"
            />
          </div>
          {formError && (
            <div className="col-span-2 text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {formError}
            </div>
          )}
        </form>
      </Modal>

      <Modal
        open={deleteTarget !== null}
        title="Xác nhận xoá lớp"
        subtitle={
          deleteTarget ? `${deleteTarget.code} - ${deleteTarget.course_code}` : ""
        }
        onClose={() => setDeleteTarget(null)}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Huỷ
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Xoá
            </Button>
          </>
        }
      >
        <p className="text-[13.5px] text-ink">
          Bạn có chắc muốn xoá lớp này? Lịch học sẽ bị xoá theo. Nếu lớp đã có sinh viên đăng ký
          thì hệ thống sẽ chặn (PROTECT).
        </p>
      </Modal>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[12.5px] font-medium text-ink mb-1.5">{children}</div>;
}
