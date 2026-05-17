import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Modal, Pagination, Stat, Table, type Column } from "@/components/ui";
import Icon from "@/components/ui/Icon";
import {
  cancelRegistration,
  deleteRegistration,
  listRegistrations,
  REGISTRATION_STATUS_LABELS,
  type Registration,
  type RegistrationStatus,
} from "@/api/registrations";
import { listSemesters } from "@/api/semesters";
import { listClassSections } from "@/api/classes";
import { listMajors } from "@/api/majors";
import { extractApiError } from "@/lib/errors";
import { PAGE_SIZE } from "@/lib/constants";
import type { ClassSection, Major, Semester } from "@/types/domain";

const STATUS_TONE: Record<RegistrationStatus, "neutral" | "success" | "warn" | "danger"> = {
  PENDING: "warn",
  CONFIRMED: "success",
  CANCELLED: "danger",
};

export default function RegistrationsPage() {
  const [items, setItems] = useState<Registration[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [filterSemester, setFilterSemester] = useState<number | "">("");
  const [filterStatus, setFilterStatus] = useState<RegistrationStatus | "">("");
  const [filterClass, setFilterClass] = useState<number | "">("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterMajor, setFilterMajor] = useState<number | "">("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [cancelTarget, setCancelTarget] = useState<Registration | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Registration | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Parameters<typeof listRegistrations>[0] = { page };
      if (appliedSearch) params.search = appliedSearch;
      if (filterSemester) params.semester = filterSemester;
      if (filterStatus) params.status = filterStatus;
      if (filterClass) params.class_section = filterClass;
      if (filterDepartment) params.department = filterDepartment;
      if (filterMajor) params.major = filterMajor;
      const data = await listRegistrations(params);
      setItems(data.results);
      setTotal(data.count);
    } catch (err) {
      setError(extractApiError(err, "Không tải được danh sách đăng ký."));
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, filterClass, filterDepartment, filterMajor, filterSemester, filterStatus, page]);

  const departments = useMemo(
    () => Array.from(new Set(majors.map((m) => m.department).filter(Boolean))).sort(),
    [majors],
  );

  const filteredMajors = useMemo(
    () =>
      filterDepartment
        ? majors.filter((m) => m.department === filterDepartment)
        : majors,
    [filterDepartment, majors],
  );

  useEffect(() => {
    listSemesters({ page_size: 1000 }).then((r) => setSemesters(r.results));
    listClassSections({ page_size: 1000 }).then((r) => setClasses(r.results));
    listMajors({ page_size: 1000 }).then((r) => setMajors(r.results));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function applyFilters() {
    setPage(1);
    setAppliedSearch(search);
  }

  function clearFilters() {
    setSearch("");
    setAppliedSearch("");
    setFilterSemester("");
    setFilterStatus("");
    setFilterClass("");
    setFilterDepartment("");
    setFilterMajor("");
    setPage(1);
  }

  function openCancel(r: Registration) {
    setCancelTarget(r);
    setCancelReason("");
  }

  async function handleConfirmCancel() {
    if (!cancelTarget) return;
    setCancelSubmitting(true);
    try {
      await cancelRegistration(cancelTarget.id, cancelReason || "Admin huỷ");
      setCancelTarget(null);
      setCancelReason("");
      await refresh();
    } catch (err) {
      setError(extractApiError(err, "Không huỷ được đăng ký."));
    } finally {
      setCancelSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteRegistration(deleteTarget.id);
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      setError(extractApiError(err, "Không xoá được đăng ký."));
      setDeleteTarget(null);
    }
  }

  // Stats từ danh sách hiện tại (chỉ là trang hiện tại — KPI rough)
  const confirmedCount = items.filter((r) => r.status === "CONFIRMED").length;
  const cancelledCount = items.filter((r) => r.status === "CANCELLED").length;
  const pendingCount = items.filter((r) => r.status === "PENDING").length;

  const columns: Column<Registration>[] = [
    { key: "student_code", label: "MSSV", mono: true, width: "110px" },
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
    { key: "class_section_code", label: "Lớp HP", mono: true, width: "120px" },
    {
      key: "course_credits",
      label: "TC",
      align: "center",
      width: "60px",
      render: (r) => <span className="font-mono">{r.course_credits}</span>,
    },
    { key: "semester_code", label: "Học kỳ", mono: true, width: "140px" },
    {
      key: "status",
      label: "Trạng thái",
      width: "130px",
      render: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status_display}</Badge>,
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
      key: "actions",
      label: "",
      width: "180px",
      align: "right",
      render: (r) => (
        <div className="flex justify-end gap-1">
          {r.status !== "CANCELLED" && (
            <Button
              size="sm"
              variant="ghost"
              icon="x"
              onClick={() => openCancel(r)}
            >
              Huỷ
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            icon="trash"
            onClick={() => setDeleteTarget(r)}
          >
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
            Quản lý đăng ký môn học
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Tổng (trên trang)" value={items.length} icon="doc" tone="accent" />
        <Stat label="Đã đăng ký" value={confirmedCount} icon="check" />
        <Stat label="Đã huỷ" value={cancelledCount} icon="x" />
        <Stat label="Chờ xác nhận" value={pendingCount} icon="clock" />
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
              placeholder="Tìm theo MSSV / mã lớp…"
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
            value={filterClass}
            onChange={(e) => {
              setFilterClass(e.target.value === "" ? "" : Number(e.target.value));
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-md bg-surface border border-line text-[13px] max-w-[200px]"
          >
            <option value="">Tất cả lớp HP</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} · {c.course_code}
              </option>
            ))}
          </select>
          <select
            value={filterDepartment}
            onChange={(e) => {
              setFilterDepartment(e.target.value);
              setFilterMajor("");
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-md bg-surface border border-line text-[13px]"
          >
            <option value="">Tất cả khoa</option>
            {departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
          <select
            value={filterMajor}
            onChange={(e) => {
              setFilterMajor(e.target.value === "" ? "" : Number(e.target.value));
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-md bg-surface border border-line text-[13px] max-w-[220px]"
          >
            <option value="">Tất cả ngành</option>
            {filteredMajors.map((major) => (
              <option key={major.id} value={major.id}>
                {major.code} - {major.name}
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
          <Button onClick={applyFilters}>Tìm</Button>
          {(appliedSearch ||
            filterSemester ||
            filterClass ||
            filterDepartment ||
            filterMajor ||
            filterStatus) && (
            <Button variant="ghost" onClick={clearFilters}>
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
          emptyText="Không có đăng ký nào khớp filter."
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
      </Card>

      {/* Cancel modal */}
      <Modal
        open={cancelTarget !== null}
        title="Huỷ đăng ký môn"
        subtitle={
          cancelTarget
            ? `${cancelTarget.student_code} · ${cancelTarget.course_code} ${cancelTarget.class_section_code}`
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
          <p className="text-[13.5px] text-ink">
            Huỷ đăng ký này sẽ chuyển status sang <strong>CANCELLED</strong> và giảm{" "}
            <code className="font-mono text-[12px] bg-surface px-1 rounded">enrolled_count</code> của
            lớp HP qua signal.
          </p>
          <label className="block">
            <div className="text-[12.5px] font-medium text-ink mb-1.5">Lý do huỷ</div>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Sinh viên rút đăng ký do trùng lịch / lý do cá nhân..."
              rows={3}
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none resize-y"
            />
            <div className="text-[11.5px] text-ink-faint mt-1">
              Để trống sẽ ghi "Admin huỷ" mặc định.
            </div>
          </label>
        </div>
      </Modal>

      {/* Delete modal */}
      <Modal
        open={deleteTarget !== null}
        title="Xoá bản ghi đăng ký"
        subtitle={
          deleteTarget
            ? `${deleteTarget.student_code} · ${deleteTarget.course_code}`
            : ""
        }
        onClose={() => setDeleteTarget(null)}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Đóng
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Xoá vĩnh viễn
            </Button>
          </>
        }
      >
        <p className="text-[13.5px] text-ink">
          <strong>Xoá vĩnh viễn</strong> bản ghi (DELETE thật trên DB). Nếu sinh viên không thật
          sự đăng ký mà là dữ liệu lỗi/test. Bình thường nên dùng <strong>Huỷ</strong> (soft
          delete) để giữ lịch sử.
        </p>
      </Modal>
    </div>
  );
}
