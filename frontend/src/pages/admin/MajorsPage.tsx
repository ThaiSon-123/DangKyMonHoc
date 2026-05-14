import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Badge, Button, Card, Modal, Pagination, Table, type Column } from "@/components/ui";
import Icon from "@/components/ui/Icon";
import {
  createMajor,
  deleteMajor,
  listMajors,
  updateMajor,
  type MajorInput,
} from "@/api/majors";
import { extractApiError } from "@/lib/errors";
import { showErrorToast } from "@/lib/toast";
import { PAGE_SIZE } from "@/lib/constants";
import type { Major } from "@/types/domain";

const EMPTY_FORM: MajorInput = {
  code: "",
  name: "",
  department: "",
  duration_years: 4,
  description: "",
  is_active: true,
};

export default function MajorsPage() {
  const [items, setItems] = useState<Major[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Major | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<MajorInput>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Major | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listMajors({
        search: appliedSearch || undefined,
        page,
      });
      setItems(data.results);
      setTotal(data.count);
    } catch (err) {
      setError(extractApiError(err, "Không tải được danh sách ngành."));
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, page]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function applySearch() {
    setPage(1);
    setAppliedSearch(search);
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(m: Major) {
    setEditing(m);
    setForm({
      code: m.code,
      name: m.name,
      department: m.department,
      duration_years: m.duration_years,
      description: m.description,
      is_active: m.is_active,
    });
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      if (editing) {
        await updateMajor(editing.id, form);
      } else {
        await createMajor(form);
      }
      setShowForm(false);
      await refresh();
    } catch (err) {
      const message = extractApiError(err);
      setFormError(message);
      showErrorToast(message, "Không lưu được ngành");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMajor(deleteTarget.id);
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      setError(extractApiError(err, "Không xoá được ngành."));
      setDeleteTarget(null);
    }
  }

  const columns: Column<Major>[] = [
    { key: "code", label: "Mã ngành", mono: true, width: "120px" },
    { key: "name", label: "Tên ngành" },
    {
      key: "department",
      label: "Khoa",
      render: (m) => m.department || <span className="text-ink-faint">—</span>,
    },
    {
      key: "duration_years",
      label: "Số năm",
      align: "center",
      width: "80px",
      render: (m) => <span className="font-mono text-[12.5px]">{m.duration_years}</span>,
    },
    {
      key: "is_active",
      label: "Trạng thái",
      width: "120px",
      render: (m) =>
        m.is_active ? <Badge tone="success">Đang dùng</Badge> : <Badge tone="neutral">Ngừng</Badge>,
    },
    {
      key: "actions",
      label: "",
      width: "120px",
      align: "right",
      render: (m) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" icon="edit" onClick={() => openEdit(m)}>
            Sửa
          </Button>
          <Button size="sm" variant="ghost" icon="trash" onClick={() => setDeleteTarget(m)}>
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
            Ngành đào tạo
          </h1>
          <p className="mt-1 text-[13.5px] text-ink-muted">
            Quản lý các ngành đào tạo (CNTT, KTPM, HTTT…) — gắn vào chương trình đào tạo và hồ sơ
            sinh viên.
          </p>
        </div>
        <Button variant="primary" icon="plus" onClick={openCreate}>
          Thêm ngành
        </Button>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface border border-line w-72">
            <Icon name="search" size={15} className="text-ink-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
              placeholder="Tìm theo mã / tên / khoa…"
              className="flex-1 bg-transparent outline-none text-[13px] min-w-0"
            />
          </div>
          <Button variant="secondary" size="md" onClick={applySearch}>
            Tìm
          </Button>
          {appliedSearch && (
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                setSearch("");
                setAppliedSearch("");
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
          rowKey={(m) => m.id}
          loading={loading}
          emptyText="Chưa có ngành nào. Bấm 'Thêm ngành' để bắt đầu."
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
      </Card>

      {/* Form modal */}
      <Modal
        open={showForm}
        title={editing ? `Sửa ngành: ${editing.code}` : "Thêm ngành đào tạo"}
        subtitle={editing ? "Cập nhật thông tin ngành" : "Tạo ngành mới"}
        onClose={() => setShowForm(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Huỷ
            </Button>
            <Button
              variant="primary"
              type="submit"
              form="major-form"
              disabled={submitting}
            >
              {submitting ? "Đang lưu..." : "Lưu"}
            </Button>
          </>
        }
      >
        <form id="major-form" onSubmit={handleSubmit} className="space-y-3">
          <Field
            label="Mã ngành *"
            value={form.code}
            onChange={(v) => setForm({ ...form, code: v.toUpperCase() })}
            placeholder="CNTT"
            required
            mono
          />
          <Field
            label="Tên ngành *"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            placeholder="Công nghệ thông tin"
            required
          />
          <Field
            label="Khoa quản lý"
            value={form.department}
            onChange={(v) => setForm({ ...form, department: v })}
            placeholder="Khoa CNTT"
          />
          <label className="block">
            <div className="text-[12.5px] font-medium text-ink mb-1.5">
              Số năm đào tạo *
            </div>
            <input
              type="number"
              min={1}
              max={10}
              required
              value={form.duration_years}
              onChange={(e) =>
                setForm({ ...form, duration_years: Number(e.target.value) })
              }
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            />
          </label>
          <TextArea
            label="Mô tả"
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
          />
          <label className="inline-flex items-center gap-2 text-[13px] cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-line-strong accent-navy-600"
            />
            <span>Đang sử dụng</span>
          </label>
          {formError && (
            <div className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {formError}
            </div>
          )}
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={deleteTarget !== null}
        title="Xác nhận xoá"
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
          Bạn có chắc muốn xoá ngành này? Hành động không thể hoàn tác. Nếu ngành đã có chương
          trình đào tạo / sinh viên liên kết, hệ thống sẽ chặn xoá.
        </p>
      </Modal>
    </div>
  );
}

// ---- Small form helpers ----

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  mono?: boolean;
}) {
  return (
    <label className="block">
      <div className="text-[12.5px] font-medium text-ink mb-1.5">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={`w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none ${
          mono ? "font-mono" : ""
        }`}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <div className="text-[12.5px] font-medium text-ink mb-1.5">{label}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none resize-y"
      />
    </label>
  );
}
