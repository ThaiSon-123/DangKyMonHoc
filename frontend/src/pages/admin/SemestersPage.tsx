import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Badge, Button, Card, Modal, Pagination, Table, type Column } from "@/components/ui";
import { PAGE_SIZE } from "@/lib/constants";
import {
  closeSemester,
  createSemester,
  deleteSemester,
  listSemesters,
  openSemester,
  updateSemester,
  type SemesterInput,
} from "@/api/semesters";
import { extractApiError } from "@/lib/errors";
import { showErrorToast } from "@/lib/toast";
import type { Semester, SemesterTerm } from "@/types/domain";

const TERM_OPTIONS: { value: SemesterTerm; label: string }[] = [
  { value: 1, label: "Học kỳ 1" },
  { value: 2, label: "Học kỳ 2" },
  { value: 3, label: "Học kỳ hè" },
];

const EMPTY: SemesterInput = {
  code: "",
  name: "",
  term: 1,
  academic_year: "",
  start_date: "",
  end_date: "",
  registration_start: null,
  registration_end: null,
  is_open: false,
};

function fmtDate(s?: string | null) {
  if (!s) return "—";
  return s.slice(0, 10);
}

function fmtDateTime(s?: string | null) {
  if (!s) return "—";
  return s.replace("T", " ").slice(0, 16);
}

export default function SemestersPage() {
  const [items, setItems] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Semester | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SemesterInput>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Semester | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listSemesters({ page });
      setItems(data.results);
      setTotal(data.count);
    } catch (err) {
      setError(extractApiError(err, "Không tải được danh sách học kỳ."));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(s: Semester) {
    setEditing(s);
    setForm({
      code: s.code,
      name: s.name,
      term: s.term,
      academic_year: s.academic_year,
      start_date: s.start_date,
      end_date: s.end_date,
      registration_start: s.registration_start ? s.registration_start.slice(0, 16) : null,
      registration_end: s.registration_end ? s.registration_end.slice(0, 16) : null,
      is_open: s.is_open,
    });
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const payload: Partial<SemesterInput> = {
        ...form,
        registration_start: form.registration_start || null,
        registration_end: form.registration_end || null,
      };
      if (editing) await updateSemester(editing.id, payload);
      else await createSemester(payload);
      setShowForm(false);
      await refresh();
    } catch (err) {
      const message = extractApiError(err);
      setFormError(message);
      showErrorToast(message, "Không lưu được học kỳ");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleOpen(s: Semester) {
    setToggling(s.id);
    try {
      if (s.is_open) await closeSemester(s.id);
      else await openSemester(s.id);
      await refresh();
    } catch (err) {
      setError(extractApiError(err, "Không đổi được trạng thái."));
    } finally {
      setToggling(null);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteSemester(deleteTarget.id);
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      setError(extractApiError(err, "Không xoá được học kỳ."));
      setDeleteTarget(null);
    }
  }

  const columns: Column<Semester>[] = [
    { key: "code", label: "Mã", mono: true, width: "160px" },
    { key: "name", label: "Tên" },
    { key: "term_display", label: "Loại", width: "100px" },
    {
      key: "duration",
      label: "Thời gian",
      width: "200px",
      render: (s) => (
        <span className="font-mono text-[12px] text-ink-muted">
          {fmtDate(s.start_date)} → {fmtDate(s.end_date)}
        </span>
      ),
    },
    {
      key: "reg_window",
      label: "Đăng ký",
      render: (s) => (
        <span className="font-mono text-[12px] text-ink-muted">
          {fmtDateTime(s.registration_start)} → {fmtDateTime(s.registration_end)}
        </span>
      ),
    },
    {
      key: "is_open",
      label: "Trạng thái",
      width: "120px",
      render: (s) =>
        s.is_open ? <Badge tone="success">Đang mở</Badge> : <Badge tone="neutral">Đã đóng</Badge>,
    },
    {
      key: "actions",
      label: "",
      width: "200px",
      align: "right",
      render: (s) => (
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant={s.is_open ? "danger" : "primary"}
            onClick={() => handleToggleOpen(s)}
            disabled={toggling === s.id}
          >
            {s.is_open ? "Đóng" : "Mở"}
          </Button>
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
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h1 className="m-0 text-[22px] font-semibold tracking-tight text-ink">Học kỳ</h1>
          <p className="mt-1 text-[13.5px] text-ink-muted">
            Tạo học kỳ, cấu hình thời gian đăng ký, mở / đóng đợt đăng ký môn học.
          </p>
        </div>
        <Button variant="primary" icon="plus" onClick={openCreate}>
          Thêm học kỳ
        </Button>
      </div>

      <Card>
        {error && (
          <div className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-3">
            {error}
          </div>
        )}
        <Table
          columns={columns}
          rows={items}
          rowKey={(s) => s.id}
          loading={loading}
          emptyText="Chưa có học kỳ nào."
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
      </Card>

      <Modal
        open={showForm}
        title={editing ? `Sửa học kỳ: ${editing.code}` : "Thêm học kỳ"}
        onClose={() => setShowForm(false)}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Huỷ
            </Button>
            <Button variant="primary" type="submit" form="semester-form" disabled={submitting}>
              {submitting ? "Đang lưu..." : "Lưu"}
            </Button>
          </>
        }
      >
        <form id="semester-form" onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <div className="col-span-1">
            <Label>Mã *</Label>
            <input
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="2025-2026-HK2"
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] font-mono focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            />
          </div>
          <div className="col-span-1">
            <Label>Loại học kỳ *</Label>
            <select
              required
              value={form.term}
              onChange={(e) =>
                setForm({ ...form, term: Number(e.target.value) as SemesterTerm })
              }
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            >
              {TERM_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <Label>Tên học kỳ *</Label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Học kỳ 2 năm học 2025-2026"
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            />
          </div>
          <div className="col-span-2">
            <Label>Năm học *</Label>
            <input
              required
              value={form.academic_year}
              onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
              placeholder="2025-2026"
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] font-mono focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            />
          </div>
          <div>
            <Label>Ngày bắt đầu *</Label>
            <input
              required
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            />
          </div>
          <div>
            <Label>Ngày kết thúc *</Label>
            <input
              required
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            />
          </div>
          <div>
            <Label>Bắt đầu đăng ký</Label>
            <input
              type="datetime-local"
              value={form.registration_start ?? ""}
              onChange={(e) =>
                setForm({ ...form, registration_start: e.target.value || null })
              }
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            />
          </div>
          <div>
            <Label>Kết thúc đăng ký</Label>
            <input
              type="datetime-local"
              value={form.registration_end ?? ""}
              onChange={(e) => setForm({ ...form, registration_end: e.target.value || null })}
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            />
          </div>
          <label className="col-span-2 inline-flex items-center gap-2 text-[13px] cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_open}
              onChange={(e) => setForm({ ...form, is_open: e.target.checked })}
              className="w-4 h-4 rounded border-line-strong accent-navy-600"
            />
            <span>Mở đăng ký ngay</span>
          </label>
          {formError && (
            <div className="col-span-2 text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {formError}
            </div>
          )}
        </form>
      </Modal>

      <Modal
        open={deleteTarget !== null}
        title="Xác nhận xoá"
        subtitle={deleteTarget ? `${deleteTarget.code}` : ""}
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
          Bạn có chắc muốn xoá học kỳ này? Nếu đã có lớp học phần / đăng ký, hệ thống sẽ chặn.
        </p>
      </Modal>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[12.5px] font-medium text-ink mb-1.5">{children}</div>;
}
