import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge, Button, Card, Modal, Stat, Table, type Column } from "@/components/ui";
import {
  createSchedule,
  deleteSchedule,
  getClassSection,
  updateSchedule,
  type ScheduleInput,
} from "@/api/classes";
import { extractApiError } from "@/lib/errors";
import { showErrorToast } from "@/lib/toast";
import {
  SESSION_LABELS,
  SESSION_PERIODS,
  WEEKDAY_LABELS,
  type ClassSection,
  type ClassStatus,
  type Schedule,
  type SessionType,
  type Weekday,
} from "@/types/domain";

const STATUS_TONE: Record<ClassStatus, "neutral" | "success" | "warn" | "danger"> = {
  DRAFT: "neutral",
  OPEN: "success",
  CLOSED: "warn",
  CANCELLED: "danger",
};

const EMPTY: Omit<ScheduleInput, "class_section"> = {
  weekday: 0,
  session: "MORNING",
  start_period: 1,
  room: "",
  start_date: null,
  end_date: null,
};

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const classId = Number(id);

  const [data, setData] = useState<ClassSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Schedule | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<ScheduleInput, "class_section">>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null);

  const refresh = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    setError(null);
    try {
      const d = await getClassSection(classId);
      setData(d);
    } catch (err) {
      setError(extractApiError(err, "Không tải được lớp."));
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(s: Schedule) {
    setEditing(s);
    setForm({
      weekday: s.weekday,
      session: s.session,
      start_period: s.start_period,
      room: s.room,
      start_date: s.start_date,
      end_date: s.end_date,
    });
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const payload: ScheduleInput = {
        class_section: classId,
        weekday: form.weekday,
        session: form.session,
        start_period: form.start_period,
        room: form.room,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      };
      if (editing) await updateSchedule(editing.id, payload);
      else await createSchedule(payload);
      setShowForm(false);
      await refresh();
    } catch (err) {
      const message = extractApiError(err);
      setFormError(message);
      showErrorToast(message, "Không lưu được lịch học");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteSchedule(deleteTarget.id);
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      setError(extractApiError(err, "Không xoá được lịch học."));
      setDeleteTarget(null);
    }
  }

  if (loading && !data) {
    return <div className="text-ink-muted">Đang tải...</div>;
  }

  if (!data) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-danger">{error || "Không tìm thấy lớp."}</div>
        <Link to="/admin/classes" className="text-navy-600 text-sm">
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  // Tính start_period range cho session đang chọn
  const [sessionStart, sessionEnd] = SESSION_PERIODS[form.session];
  const maxStartPeriod = Math.min(sessionEnd, sessionEnd - data.periods_per_session + 1);
  const validStartPeriods = Array.from(
    { length: maxStartPeriod - sessionStart + 1 },
    (_, i) => sessionStart + i,
  );

  const scheduleColumns: Column<Schedule>[] = [
    {
      key: "weekday",
      label: "Thứ",
      width: "100px",
      render: (s) => WEEKDAY_LABELS[s.weekday],
    },
    {
      key: "session",
      label: "Buổi",
      width: "100px",
      render: (s) => SESSION_LABELS[s.session].split(" (")[0],
    },
    {
      key: "periods",
      label: "Tiết",
      width: "120px",
      align: "center",
      render: (s) => (
        <span className="font-mono">
          {s.start_period} – {s.end_period}
        </span>
      ),
    },
    {
      key: "room",
      label: "Phòng",
      width: "140px",
      render: (s) => s.room || <span className="text-ink-faint">—</span>,
    },
    {
      key: "date_range",
      label: "Khoảng ngày",
      render: (s) =>
        s.start_date || s.end_date ? (
          <span className="font-mono text-[12px] text-ink-muted">
            {s.start_date ?? "?"} → {s.end_date ?? "?"}
          </span>
        ) : (
          <span className="text-ink-faint">Toàn học kỳ</span>
        ),
    },
    {
      key: "actions",
      label: "",
      width: "140px",
      align: "right",
      render: (s) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" icon="edit" onClick={() => openEdit(s)}>
            Sửa
          </Button>
          <Button size="sm" variant="ghost" icon="trash" onClick={() => setDeleteTarget(s)}>
            Xoá
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <Link to="/admin/classes" className="text-[12.5px] text-navy-600 hover:underline">
          ← Danh sách lớp học phần
        </Link>
      </div>

      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[13px] text-ink-muted">{data.code}</span>
            <Badge tone={STATUS_TONE[data.status]}>{data.status_display}</Badge>
            {data.is_full && <Badge tone="danger">Đầy</Badge>}
          </div>
          <h1 className="m-0 mt-1 text-[22px] font-semibold tracking-tight text-ink">
            {data.course_code} – {data.course_name}
          </h1>
          <p className="mt-1 text-[13.5px] text-ink-muted">
            Học kỳ <span className="font-mono">{data.semester_code}</span>
            {data.teacher_name && (
              <>
                {" "}· Giáo viên <span className="font-medium">{data.teacher_name}</span>{" "}
                <span className="font-mono text-ink-faint">({data.teacher_code})</span>
              </>
            )}
          </p>
          {data.note && (
            <p className="mt-2 text-[13px] text-ink-muted max-w-prose">{data.note}</p>
          )}
        </div>
        <Button variant="primary" icon="plus" onClick={openCreate}>
          Thêm lịch học
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="Sĩ số"
          value={`${data.enrolled_count}/${data.max_students}`}
          icon="users"
          tone="accent"
        />
        <Stat
          label="Tiết / buổi"
          value={data.periods_per_session}
          hint="số tiết liên tiếp"
          icon="clock"
        />
        <Stat
          label="Phòng học"
          value={
            Array.from(new Set(data.schedules.map((schedule) => schedule.room).filter(Boolean))).join(", ") || "—"
          }
          icon="calendar"
        />
        <Stat label="Số tín chỉ" value={data.course_credits} icon="book" />
      </div>

      {error && (
        <div className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <Card title="Lịch học hàng tuần" subtitle="Quản lý buổi học của lớp">
        <Table
          columns={scheduleColumns}
          rows={data.schedules}
          rowKey={(s) => s.id}
          emptyText="Chưa có buổi học nào. Bấm 'Thêm lịch học' để bắt đầu."
        />
      </Card>

      <Modal
        open={showForm}
        title={editing ? "Sửa lịch học" : "Thêm lịch học"}
        subtitle={`Mỗi buổi ${data.periods_per_session} tiết liên tiếp`}
        onClose={() => setShowForm(false)}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Huỷ
            </Button>
            <Button variant="primary" type="submit" form="sched-form" disabled={submitting}>
              {submitting ? "Đang lưu..." : "Lưu"}
            </Button>
          </>
        }
      >
        <form id="sched-form" onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <div>
            <Label>Thứ *</Label>
            <select
              required
              value={form.weekday}
              onChange={(e) => setForm({ ...form, weekday: Number(e.target.value) as Weekday })}
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
            <Label>Buổi *</Label>
            <select
              required
              value={form.session}
              onChange={(e) => {
                const newSession = e.target.value as SessionType;
                const [start] = SESSION_PERIODS[newSession];
                setForm({ ...form, session: newSession, start_period: start });
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
              value={form.start_period}
              onChange={(e) => setForm({ ...form, start_period: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            >
              {validStartPeriods.length === 0 ? (
                <option disabled value={sessionStart}>
                  Không hợp lệ — giảm số tiết / buổi
                </option>
              ) : (
                validStartPeriods.map((p) => (
                  <option key={p} value={p}>
                    Tiết {p} (đến tiết {p + data.periods_per_session - 1})
                  </option>
                ))
              )}
            </select>
            <div className="text-[11.5px] text-ink-faint mt-1">
              Buổi {SESSION_LABELS[form.session].split(" (")[0]}: tiết {sessionStart}-{sessionEnd}
            </div>
          </div>
          <div>
            <Label>Phòng học</Label>
            <input
              value={form.room}
              onChange={(e) => setForm({ ...form, room: e.target.value })}
              placeholder="B4.12"
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            />
          </div>
          <div>
            <Label>Ngày bắt đầu (nếu lịch riêng)</Label>
            <input
              type="date"
              value={form.start_date ?? ""}
              onChange={(e) => setForm({ ...form, start_date: e.target.value || null })}
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            />
          </div>
          <div>
            <Label>Ngày kết thúc</Label>
            <input
              type="date"
              value={form.end_date ?? ""}
              onChange={(e) => setForm({ ...form, end_date: e.target.value || null })}
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
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
        title="Xác nhận xoá lịch học"
        subtitle={
          deleteTarget
            ? `${WEEKDAY_LABELS[deleteTarget.weekday]} · tiết ${deleteTarget.start_period}-${deleteTarget.end_period}`
            : ""
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
          Bạn có chắc muốn xoá buổi học này khỏi lịch của lớp?
        </p>
      </Modal>

      <p className="text-[11.5px] text-ink-faint">
        Lưu ý: thiết lập lịch xong nên đổi trạng thái lớp sang <strong>"Đang mở"</strong> để sinh
        viên có thể đăng ký. Trạng thái Open yêu cầu phải có giáo viên phụ trách.
      </p>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[12.5px] font-medium text-ink mb-1.5">{children}</div>;
}
