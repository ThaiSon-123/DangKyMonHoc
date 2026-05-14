import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, Modal, Pagination, Table, type Column } from "@/components/ui";
import Icon from "@/components/ui/Icon";
import {
  createCurriculum,
  deleteCurriculum,
  listCurriculums,
  updateCurriculum,
  type CurriculumInput,
} from "@/api/curriculums";
import { listMajors } from "@/api/majors";
import { extractApiError } from "@/lib/errors";
import { showErrorToast } from "@/lib/toast";
import { PAGE_SIZE } from "@/lib/constants";
import type { Curriculum, Major } from "@/types/domain";

const EMPTY: CurriculumInput = {
  code: "",
  name: "",
  major: 0,
  cohort_year: new Date().getFullYear(),
  total_credits_required: 145,
  description: "",
  is_active: true,
};

export default function CurriculumsPage() {
  const [items, setItems] = useState<Curriculum[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [filterMajor, setFilterMajor] = useState<number | "">("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Curriculum | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CurriculumInput>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Curriculum | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { search?: string; major?: number; page?: number } = { page };
      if (appliedSearch) params.search = appliedSearch;
      if (filterMajor) params.major = filterMajor;
      const data = await listCurriculums(params);
      setItems(data.results);
      setTotal(data.count);
    } catch (err) {
      setError(extractApiError(err, "Không tải được danh sách CTĐT."));
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, filterMajor, page]);

  useEffect(() => {
    // Fetch tất cả majors (page_size lớn) để dropdown đầy đủ
    listMajors({ page: 1 }).then((r) => setMajors(r.results));
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
    setForm({ ...EMPTY, major: majors[0]?.id ?? 0 });
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(c: Curriculum) {
    setEditing(c);
    setForm({
      code: c.code,
      name: c.name,
      major: c.major,
      cohort_year: c.cohort_year,
      total_credits_required: c.total_credits_required,
      description: c.description,
      is_active: c.is_active,
    });
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      if (editing) await updateCurriculum(editing.id, form);
      else await createCurriculum(form);
      setShowForm(false);
      await refresh();
    } catch (err) {
      const message = extractApiError(err);
      setFormError(message);
      showErrorToast(message, "Không lưu được CTĐT");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteCurriculum(deleteTarget.id);
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      setError(extractApiError(err, "Không xoá được CTĐT."));
      setDeleteTarget(null);
    }
  }

  const columns: Column<Curriculum>[] = [
    { key: "code", label: "Mã CTĐT", mono: true, width: "140px" },
    {
      key: "name",
      label: "Tên",
      render: (c) => (
        <Link to={`/admin/curriculum/${c.id}`} className="text-navy-600 font-medium hover:underline">
          {c.name}
        </Link>
      ),
    },
    { key: "major_code", label: "Ngành", width: "90px", mono: true },
    {
      key: "cohort_year",
      label: "Khóa",
      width: "70px",
      align: "center",
      render: (c) => <span className="font-mono">{c.cohort_year}</span>,
    },
    {
      key: "credits",
      label: "Tổng TC",
      width: "90px",
      align: "center",
      render: (c) => <span className="font-mono">{c.total_credits_required}</span>,
    },
    {
      key: "courses_count",
      label: "Số môn",
      width: "90px",
      align: "center",
      render: (c) => <Badge tone="accent">{c.curriculum_courses?.length ?? 0}</Badge>,
    },
    {
      key: "is_active",
      label: "Trạng thái",
      width: "110px",
      render: (c) =>
        c.is_active ? <Badge tone="success">Đang dùng</Badge> : <Badge tone="neutral">Ngừng</Badge>,
    },
    {
      key: "actions",
      label: "",
      width: "180px",
      align: "right",
      render: (c) => (
        <div className="flex justify-end gap-1">
          <Link to={`/admin/curriculum/${c.id}`}>
            <Button size="sm" variant="ghost" icon="layers">
              Chi tiết
            </Button>
          </Link>
          <Button size="sm" variant="ghost" icon="edit" onClick={() => openEdit(c)}>
            Sửa
          </Button>
          <Button size="sm" variant="ghost" icon="trash" onClick={() => setDeleteTarget(c)}>
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
            Chương trình đào tạo
          </h1>
        </div>
        <Button variant="primary" icon="plus" onClick={openCreate}>
          Thêm CTĐT
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
              placeholder="Tìm theo mã / tên CTĐT…"
              className="flex-1 bg-transparent outline-none text-[13px] min-w-0"
            />
          </div>
          <select
            value={filterMajor}
            onChange={(e) => {
              setFilterMajor(e.target.value === "" ? "" : Number(e.target.value));
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-md bg-surface border border-line text-[13px]"
          >
            <option value="">Tất cả ngành</option>
            {majors.map((m) => (
              <option key={m.id} value={m.id}>
                {m.code} - {m.name}
              </option>
            ))}
          </select>
          <Button onClick={applyFilters}>Tìm</Button>
          {(appliedSearch || filterMajor !== "") && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("");
                setAppliedSearch("");
                setFilterMajor("");
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
          rowKey={(c) => c.id}
          loading={loading}
          emptyText="Chưa có CTĐT nào. Bấm 'Thêm CTĐT' để tạo mới."
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
      </Card>

      {/* Form modal */}
      <Modal
        open={showForm}
        title={editing ? `Sửa CTĐT: ${editing.code}` : "Thêm chương trình đào tạo"}
        onClose={() => setShowForm(false)}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Huỷ
            </Button>
            <Button variant="primary" type="submit" form="cur-form" disabled={submitting}>
              {submitting ? "Đang lưu..." : "Lưu"}
            </Button>
          </>
        }
      >
        <form id="cur-form" onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <div className="col-span-1">
            <Label>Mã CTĐT *</Label>
            <input
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="CNTT-2024"
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] font-mono focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            />
          </div>
          <div className="col-span-1">
            <Label>Ngành *</Label>
            <select
              required
              value={form.major}
              onChange={(e) => setForm({ ...form, major: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            >
              <option value={0}>-- chọn ngành --</option>
              {majors.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.code} - {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <Label>Tên CTĐT *</Label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="CTĐT Công nghệ thông tin khóa 2024"
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            />
          </div>
          <div>
            <Label>Năm khóa *</Label>
            <input
              required
              type="number"
              min={2000}
              max={2100}
              value={form.cohort_year}
              onChange={(e) => setForm({ ...form, cohort_year: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            />
          </div>
          <div>
            <Label>Tổng số tín chỉ yêu cầu</Label>
            <input
              type="number"
              min={1}
              value={form.total_credits_required}
              onChange={(e) =>
                setForm({ ...form, total_credits_required: Number(e.target.value) })
              }
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            />
          </div>
          <div className="col-span-2">
            <Label>Mô tả</Label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none resize-y"
            />
          </div>
          <label className="col-span-2 inline-flex items-center gap-2 text-[13px] cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-line-strong accent-navy-600"
            />
            <span>Đang sử dụng</span>
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
        title="Xác nhận xoá CTĐT"
        subtitle={deleteTarget ? `${deleteTarget.code} - ${deleteTarget.name}` : ""}
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
          Bạn có chắc muốn xoá CTĐT này? Các liên kết môn học trong CTĐT sẽ bị xoá theo. Nếu có
          sinh viên đang gắn với CTĐT, hệ thống sẽ chặn.
        </p>
      </Modal>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[12.5px] font-medium text-ink mb-1.5">{children}</div>;
}
