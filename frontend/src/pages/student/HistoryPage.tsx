import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Modal,
  Pagination,
  Stat,
  Table,
  type Column,
} from "@/components/ui";
import Icon from "@/components/ui/Icon";
import {
  cancelRegistration,
  listRegistrations,
  REGISTRATION_STATUS_LABELS,
  type Registration,
  type RegistrationStatus,
} from "@/api/registrations";
import { listSemesters } from "@/api/semesters";
import { extractApiError } from "@/lib/errors";
import { PAGE_SIZE } from "@/lib/constants";
import type { Semester } from "@/types/domain";

const STATUS_TONE: Record<RegistrationStatus, "warn" | "success" | "danger"> = {
  PENDING: "warn",
  CONFIRMED: "success",
  CANCELLED: "danger",
};

export default function StudentHistoryPage() {
  const [items, setItems] = useState<Registration[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterSemester, setFilterSemester] = useState<number | "">("");
  const [filterStatus, setFilterStatus] = useState<RegistrationStatus | "">("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [cancelTarget, setCancelTarget] = useState<Registration | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Parameters<typeof listRegistrations>[0] = { page };
      if (filterSemester) params.semester = filterSemester;
      if (filterStatus) params.status = filterStatus;
      const data = await listRegistrations(params);
      setItems(data.results);
      setTotal(data.count);
    } catch (err) {
      setError(extractApiError(err, "Không tải được lịch sử đăng ký."));
    } finally {
      setLoading(false);
    }
  }, [filterSemester, filterStatus, page]);

  useEffect(() => {
    listSemesters({ page_size: 1000 }).then((r) => setSemesters(r.results));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleConfirmCancel() {
    if (!cancelTarget) return;
    setCancelSubmitting(true);
    try {
      await cancelRegistration(cancelTarget.id, cancelReason || "SV tự huỷ");
      setCancelTarget(null);
      setCancelReason("");
      await refresh();
    } catch (err) {
      setError(extractApiError(err, "Không huỷ được."));
    } finally {
      setCancelSubmitting(false);
    }
  }

  // Stats từ data trang hiện tại
  const confirmedCount = items.filter((r) => r.status === "CONFIRMED").length;
  const cancelledCount = items.filter((r) => r.status === "CANCELLED").length;
  const totalCredits = items
    .filter((r) => r.status === "CONFIRMED")
    .reduce((s, r) => s + r.course_credits, 0);

  const columns: Column<Registration>[] = [
    { key: "semester_code", label: "Học kỳ", mono: true, width: "140px" },
    {
      key: "course",
      label: "Môn học",
      render: (r) => (
        <div>
          <div className="font-mono text-[12px] text-ink-muted">
            {r.course_code}
          </div>
          <div className="text-[13px]">{r.course_name}</div>
        </div>
      ),
    },
    { key: "class_section_code", label: "Lớp HP", mono: true, width: "120px" },
    {
      key: "course_credits",
      label: "TC",
      align: "center",
      width: "60px",
      render: (r) => <span className="font-mono">{r.course_credits}</span>,
    },
    {
      key: "status",
      label: "Trạng thái",
      width: "130px",
      render: (r) => (
        <Badge tone={STATUS_TONE[r.status]}>{r.status_display}</Badge>
      ),
    },
    {
      key: "registered_at",
      label: "Đăng ký",
      width: "150px",
      render: (r) => (
        <span className="font-mono text-[12px] text-ink-muted">
          {r.registered_at.replace("T", " ").slice(0, 16)}
        </span>
      ),
    },
    {
      key: "cancel_reason",
      label: "Lý do hủy",
      render: (r) =>
        r.cancel_reason || <span className="text-ink-faint">—</span>,
    },
    {
      key: "actions",
      label: "",
      width: "110px",
      align: "right",
      render: (r) =>
        r.status !== "CANCELLED" ? (
          <Button
            size="sm"
            variant="ghost"
            icon="x"
            onClick={() => {
              setCancelTarget(r);
              setCancelReason("");
            }}
          >
            Huỷ
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="m-0 text-[22px] font-semibold tracking-tight text-ink">
          Lịch sử đăng ký
        </h1>
        <p className="mt-1 text-[13.5px] text-ink-muted">
          Toàn bộ đăng ký môn học của bạn qua các học kỳ. Có thể huỷ đăng ký
          trong thời gian đợt đăng ký còn mở (BR-006).
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Tổng đăng ký" value={total} icon="doc" tone="accent" />
        <Stat label="Đã xác nhận" value={confirmedCount} icon="check" />
        <Stat label="Đã hủy" value={cancelledCount} icon="x" />
        <Stat
          label="TC đang học (trang này)"
          value={totalCredits}
          icon="book"
        />
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <select
            value={filterSemester}
            onChange={(e) => {
              setFilterSemester(
                e.target.value === "" ? "" : Number(e.target.value),
              );
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-md bg-surface border border-line text-[13px]"
          >
            <option value="">Tất cả học kỳ</option>
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value as RegistrationStatus | "");
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-md bg-surface border border-line text-[13px]"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(REGISTRATION_STATUS_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
          {(filterSemester || filterStatus) && (
            <Button
              variant="ghost"
              onClick={() => {
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
          rowKey={(r) => r.id}
          loading={loading}
          emptyText="Chưa có đăng ký nào."
        />
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onChange={setPage}
        />
      </Card>

      <Modal
        open={cancelTarget !== null}
        title="Huỷ đăng ký môn"
        subtitle={
          cancelTarget
            ? `${cancelTarget.course_code} · ${cancelTarget.class_section_code}`
            : ""
        }
        onClose={() => setCancelTarget(null)}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelTarget(null)}>
              Đóng
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmCancel}
              disabled={cancelSubmitting}
            >
              {cancelSubmitting ? "Đang huỷ..." : "Xác nhận huỷ"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-[12.5px] text-warn flex items-start gap-2">
            <Icon name="bell" size={16} className="mt-0.5 flex-shrink-0" />
            <div>
              Bạn chỉ được hủy đăng ký{" "}
              <strong>trong thời gian đợt đăng ký mở</strong>. Sau thời gian
              này, hệ thống sẽ không cho hủy.
            </div>
          </div>
          <label className="block">
            <div className="text-[12.5px] font-medium text-ink mb-1.5">
              Lý do huỷ (tuỳ chọn)
            </div>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Vd: Trùng lịch / đổi nguyện vọng..."
              rows={3}
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none resize-y"
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}
