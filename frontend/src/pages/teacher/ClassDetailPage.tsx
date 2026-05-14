import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge, Button, Card, Modal, Stat, Table, type Column } from "@/components/ui";
import Icon from "@/components/ui/Icon";
import { getClassSection, notifyClass, type NotifyClassInput } from "@/api/classes";
import { CATEGORY_LABELS, type NotiCategory } from "@/api/notifications";
import { listRegistrations, type Registration } from "@/api/registrations";
import { extractApiError } from "@/lib/errors";
import {

  SESSION_LABELS,
  WEEKDAY_LABELS,
  type ClassSection,
  type ClassStatus,
} from "@/types/domain";

const STATUS_TONE: Record<ClassStatus, "neutral" | "success" | "warn" | "danger"> = {
  DRAFT: "neutral",
  OPEN: "success",
  CLOSED: "warn",
  CANCELLED: "danger",
};

export default function TeacherClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const classId = Number(id);

  const [data, setData] = useState<ClassSection | null>(null);
  const [students, setStudents] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Notify modal state
  const [showNotify, setShowNotify] = useState(false);
  const [notifyForm, setNotifyForm] = useState<NotifyClassInput>({
    title: "",
    body: "",
    category: "CLASS",
  });
  const [notifySubmitting, setNotifySubmitting] = useState(false);
  const [notifyError, setNotifyError] = useState<string | null>(null);
  const [notifySuccess, setNotifySuccess] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    setError(null);
    try {
      const [cs, regs] = await Promise.all([
        getClassSection(classId),
        listRegistrations({
          class_section: classId,
          status: "CONFIRMED",
          page_size: 1000,
        }),
      ]);
      setData(cs);
      setStudents(regs.results);
    } catch (err) {
      setError(extractApiError(err, "Không tải được lớp."));
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleSendNotify(e: FormEvent) {
    e.preventDefault();
    if (!data) return;
    setNotifySubmitting(true);
    setNotifyError(null);
    try {
      const result = await notifyClass(data.id, notifyForm);
      setNotifySuccess(
        `Đã gửi thông báo "${result.notification.title}" tới ${result.recipient_count} sinh viên.`,
      );
      setShowNotify(false);
      setNotifyForm({ title: "", body: "", category: "CLASS" });
      setTimeout(() => setNotifySuccess(null), 5000);
    } catch (err) {
      setNotifyError(extractApiError(err, "Không gửi được thông báo."));
    } finally {
      setNotifySubmitting(false);
    }
  }

  if (loading && !data) return <div className="text-ink-muted">Đang tải...</div>;

  if (!data) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-danger">{error || "Không tìm thấy lớp."}</div>
        <Link to="/teacher/classes" className="text-navy-600 text-sm">
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  const studentColumns: Column<Registration>[] = [
    {
      key: "student_code",
      label: "MSSV",
      mono: true,
      width: "120px",
    },
    {
      key: "student_name",
      label: "Họ tên sinh viên",
      render: (r) => (
        <span className="text-[13px]">
          {r.student_name || r.student_code}
        </span>
      ),
    },
    { key: "course_credits", label: "TC", align: "center", width: "60px",
      render: (r) => <span className="font-mono">{r.course_credits}</span>,
    },
    {
      key: "registered_at",
      label: "Thời gian đăng ký",
      width: "180px",
      render: (r) => (
        <span className="font-mono text-[12px] text-ink-muted">
          {r.registered_at.replace("T", " ").slice(0, 16)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Trạng thái",
      width: "110px",
      render: (r) => (
        <Badge tone={r.status === "CONFIRMED" ? "success" : "warn"}>{r.status_display}</Badge>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <Link to="/teacher/classes" className="text-[12.5px] text-navy-600 hover:underline">
          ← Danh sách lớp phụ trách
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
            Học kỳ <span className="font-mono">{data.semester_code}</span> ·{" "}
            {data.course_credits} tín chỉ
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            icon="megaphone"
            onClick={() => {
              setShowNotify(true);
              setNotifyError(null);
            }}
            disabled={students.length === 0}
            title={students.length === 0 ? "Lớp chưa có SV" : ""}
          >
            Gửi thông báo
          </Button>
          <Link to={`/teacher/grades?class=${data.id}`}>
            <Button variant="primary" icon="edit">
              Nhập điểm cho lớp
            </Button>
          </Link>
        </div>
      </div>

      {notifySuccess && (
        <div className="bg-green-50 border border-green-200 rounded-md px-3 py-2 text-[13px] text-success flex items-start gap-2">
          <Icon name="check" size={16} className="mt-0.5 flex-shrink-0" />
          <div>{notifySuccess}</div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="Sĩ số"
          value={`${data.enrolled_count}/${data.max_students}`}
          icon="users"
          tone="accent"
        />
        <Stat label="Số buổi / tuần" value={data.schedules.length} icon="calendar" />
        <Stat label="Tiết / buổi" value={data.periods_per_session} icon="clock" />
        <Stat label="Tín chỉ" value={data.course_credits} icon="book" />
      </div>

      {/* Lịch học */}
      <Card title="Lịch học hàng tuần">
        {data.schedules.length === 0 ? (
          <div className="text-ink-faint text-center py-4">Chưa có lịch học</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {data.schedules.map((s) => (
              <div
                key={s.id}
                className="border border-line rounded-md p-3 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-md bg-navy-50 text-navy-600 grid place-items-center flex-shrink-0">
                  <Icon name="calendar" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-ink">
                    {WEEKDAY_LABELS[s.weekday]} ·{" "}
                    {SESSION_LABELS[s.session].split(" (")[0]} tiết {s.start_period}-
                    {s.end_period}
                  </div>
                  <div className="text-[12px] text-ink-muted">
                    {s.room ? `Phòng ${s.room}` : "Chưa thiết lập phòng"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Danh sách sinh viên */}
      <Card
        title="Danh sách sinh viên"
        subtitle={`${students.length} sinh viên đang đăng ký`}
      >
        {error && (
          <div className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-3">
            {error}
          </div>
        )}
        <Table
          columns={studentColumns}
          rows={students}
          rowKey={(r) => r.id}
          emptyText="Chưa có sinh viên nào đăng ký."
        />
      </Card>

      {data.note && (
        <Card title="Ghi chú">
          <p className="text-[13px] text-ink whitespace-pre-wrap">{data.note}</p>
        </Card>
      )}

      {/* Modal gửi thông báo cho lớp */}
      <Modal
        open={showNotify}
        title="Gửi thông báo cho lớp"
        subtitle={
          data
            ? `${data.code} - ${data.course_name} · ${students.length} sinh viên`
            : ""
        }
        onClose={() => setShowNotify(false)}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowNotify(false)}>
              Huỷ
            </Button>
            <Button
              variant="primary"
              type="submit"
              form="notify-class-form"
              icon="megaphone"
              disabled={notifySubmitting}
            >
              {notifySubmitting ? "Đang gửi..." : `Gửi cho ${students.length} SV`}
            </Button>
          </>
        }
      >
        <form id="notify-class-form" onSubmit={handleSendNotify} className="space-y-3">
          <div>
            <Label>Tiêu đề *</Label>
            <input
              required
              maxLength={200}
              value={notifyForm.title}
              onChange={(e) =>
                setNotifyForm({ ...notifyForm, title: e.target.value })
              }
              placeholder="Vd: Đổi phòng học buổi sau"
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            />
          </div>
          <div>
            <Label>Loại thông báo</Label>
            <select
              value={notifyForm.category}
              onChange={(e) =>
                setNotifyForm({
                  ...notifyForm,
                  category: e.target.value as NotiCategory,
                })
              }
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            >
              {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Nội dung *</Label>
            <textarea
              required
              rows={5}
              value={notifyForm.body}
              onChange={(e) =>
                setNotifyForm({ ...notifyForm, body: e.target.value })
              }
              placeholder="Nội dung chi tiết... vd. Tuần sau lớp đổi sang phòng B5.10 từ 13h-15h30. Sinh viên lưu ý..."
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none resize-y"
            />
          </div>
          <div className="bg-navy-50 border border-navy-100 rounded-md px-3 py-2 text-[12px] text-navy-900 flex items-start gap-2">
            <Icon name="bell" size={14} className="mt-0.5 flex-shrink-0" />
            <div>
              Thông báo sẽ gửi tới <strong>{students.length} sinh viên</strong> đã CONFIRMED
              trong lớp. SV nhận ngay tại{" "}
              <code className="font-mono bg-card px-1 rounded">/student/notifications</code>.
            </div>
          </div>
          {notifyError && (
            <div className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {notifyError}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[12.5px] font-medium text-ink mb-1.5">{children}</div>
  );
}
