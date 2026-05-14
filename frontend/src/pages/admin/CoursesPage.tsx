import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Badge, Button, Card, Modal, Pagination, Table, type Column } from "@/components/ui";
import Icon from "@/components/ui/Icon";
import {
  createCourse,
  deleteCourse,
  listCourses,
  updateCourse,
  type CourseInput,
} from "@/api/courses";
import { listCurriculums } from "@/api/curriculums";
import { listMajors } from "@/api/majors";
import { extractApiError } from "@/lib/errors";
import { showErrorToast } from "@/lib/toast";
import { PAGE_SIZE } from "@/lib/constants";
import type { Course, Curriculum, Major } from "@/types/domain";

const EMPTY: CourseInput = {
  code: "",
  name: "",
  credits: 3,
  theory_hours: 30,
  practice_hours: 0,
  description: "",
  is_active: true,
  prerequisite_ids: [],
};

export default function CoursesPage() {
  const [items, setItems] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [majors, setMajors] = useState<Major[]>([]);
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterMajor, setFilterMajor] = useState<number | "">("");
  const [filterCurriculum, setFilterCurriculum] = useState<number | "">("");

  const [editing, setEditing] = useState<Course | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CourseInput>(EMPTY);
  const [prerequisiteSearch, setPrerequisiteSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);

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

  const filteredCurriculums = useMemo(() => {
    if (filterMajor) return curriculums.filter((c) => c.major === filterMajor);
    if (!filterDepartment) return curriculums;
    const majorIds = new Set(filteredMajors.map((m) => m.id));
    return curriculums.filter((c) => majorIds.has(c.major));
  }, [curriculums, filterDepartment, filterMajor, filteredMajors]);

  const selectedPrerequisites = useMemo(
    () =>
      form.prerequisite_ids.map((id) => {
        const course = allCourses.find((c) => c.id === id) || items.find((c) => c.id === id);
        const detail = editing?.prerequisites_detail.find((p) => p.required_course === id);
        return {
          id,
          code: course?.code ?? detail?.required_course_code ?? `#${id}`,
          name: course?.name ?? detail?.required_course_name ?? "",
        };
      }),
    [allCourses, editing, form.prerequisite_ids, items],
  );

  const prerequisiteCandidates = useMemo(() => {
    const query = prerequisiteSearch.trim().toLowerCase();
    const selectedIds = new Set(form.prerequisite_ids);
    return allCourses
      .filter((c) => c.id !== editing?.id && !selectedIds.has(c.id))
      .filter((c) => {
        if (!query) return true;
        return c.code.toLowerCase().includes(query) || c.name.toLowerCase().includes(query);
      })
      .slice(0, 8);
  }, [allCourses, editing?.id, form.prerequisite_ids, prerequisiteSearch]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listCourses({
        search: appliedSearch || undefined,
        department: filterDepartment || undefined,
        major: filterMajor || undefined,
        curriculum: filterCurriculum || undefined,
        page,
      });
      setItems(data.results);
      setTotal(data.count);
    } catch (err) {
      setError(extractApiError(err, "Không tải được danh sách môn."));
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, filterCurriculum, filterDepartment, filterMajor, page]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    async function loadFilters() {
      try {
        const [majorsData, curriculumsData, coursesData] = await Promise.all([
          listMajors({ page_size: 1000 }),
          listCurriculums({ page_size: 1000 }),
          listCourses({ page_size: 1000 }),
        ]);
        setMajors(majorsData.results);
        setCurriculums(curriculumsData.results);
        setAllCourses(coursesData.results);
      } catch (err) {
        setError(extractApiError(err, "Không tải được dữ liệu bộ lọc."));
      }
    }
    loadFilters();
  }, []);

  function applySearch() {
    setPage(1);
    setAppliedSearch(search);
  }

  function clearFilters() {
    setSearch("");
    setAppliedSearch("");
    setFilterDepartment("");
    setFilterMajor("");
    setFilterCurriculum("");
    setPage(1);
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY, prerequisite_ids: [] });
    setPrerequisiteSearch("");
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(c: Course) {
    setEditing(c);
    setForm({
      code: c.code,
      name: c.name,
      credits: c.credits,
      theory_hours: c.theory_hours,
      practice_hours: c.practice_hours,
      description: c.description,
      is_active: c.is_active,
      prerequisite_ids: c.prerequisites_detail.map((p) => p.required_course),
    });
    setPrerequisiteSearch("");
    setFormError(null);
    setShowForm(true);
  }

  function addPrerequisite(course: Course) {
    setForm((current) => ({
      ...current,
      prerequisite_ids: [...current.prerequisite_ids, course.id],
    }));
    setPrerequisiteSearch("");
  }

  function removePrerequisite(id: number) {
    setForm((current) => ({
      ...current,
      prerequisite_ids: current.prerequisite_ids.filter((courseId) => courseId !== id),
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      if (editing) await updateCourse(editing.id, form);
      else await createCourse(form);
      const coursesData = await listCourses({ page_size: 1000 });
      setAllCourses(coursesData.results);
      setShowForm(false);
      await refresh();
    } catch (err) {
      const message = extractApiError(err);
      setFormError(message);
      showErrorToast(message, "Không lưu được môn học");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteCourse(deleteTarget.id);
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      setError(extractApiError(err, "Không xoá được môn học."));
      setDeleteTarget(null);
    }
  }

  const columns: Column<Course>[] = [
    { key: "code", label: "Mã môn", mono: true, width: "100px" },
    { key: "name", label: "Tên môn" },
    { key: "credits", label: "TC", align: "center", width: "60px" },
    {
      key: "hours",
      label: "LT / TH",
      align: "center",
      width: "100px",
      render: (c) => (
        <span className="font-mono text-[12px] text-ink-muted">
          {c.theory_hours} / {c.practice_hours}
        </span>
      ),
    },
    {
      key: "prereqs",
      label: "Tiên quyết",
      render: (c) =>
        c.prerequisites_detail.length === 0 ? (
          <span className="text-ink-faint">-</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {c.prerequisites_detail.map((p) => (
              <Badge key={p.id} tone="neutral" className="font-mono">
                {p.required_course_code}
              </Badge>
            ))}
          </div>
        ),
    },
    {
      key: "is_active",
      label: "Trạng thái",
      width: "120px",
      render: (c) =>
        c.is_active ? <Badge tone="success">Mở</Badge> : <Badge tone="neutral">Ngừng</Badge>,
    },
    {
      key: "actions",
      label: "",
      width: "120px",
      align: "right",
      render: (c) => (
        <div className="flex justify-end gap-1">
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

  const hasFilters = appliedSearch || filterDepartment || filterMajor || filterCurriculum;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h1 className="m-0 text-[22px] font-semibold tracking-tight text-ink">Môn học</h1>
          <p className="mt-1 text-[13.5px] text-ink-muted">
            Quản lý môn học, số tín chỉ, tiết lý thuyết / thực hành và môn tiên quyết.
          </p>
        </div>
        <Button variant="primary" icon="plus" onClick={openCreate}>
          Thêm môn
        </Button>
      </div>

      <Card>
        <div className="flex flex-wrap items-end gap-2 mb-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface border border-line w-72">
            <Icon name="search" size={15} className="text-ink-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
              placeholder="Tìm theo mã / tên môn..."
              className="flex-1 bg-transparent outline-none text-[13px] min-w-0"
            />
          </div>
          <FilterSelect
            label="Khoa"
            value={filterDepartment}
            onChange={(value) => {
              setFilterDepartment(value);
              setFilterMajor("");
              setFilterCurriculum("");
              setPage(1);
            }}
          >
            <option value="">Tất cả khoa</option>
            {departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Ngành"
            value={filterMajor}
            onChange={(value) => {
              setFilterMajor(value ? Number(value) : "");
              setFilterCurriculum("");
              setPage(1);
            }}
          >
            <option value="">Tất cả ngành</option>
            {filteredMajors.map((major) => (
              <option key={major.id} value={major.id}>
                {major.code} - {major.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="CTĐT"
            value={filterCurriculum}
            onChange={(value) => {
              setFilterCurriculum(value ? Number(value) : "");
              setPage(1);
            }}
          >
            <option value="">Tất cả CTĐT</option>
            {filteredCurriculums.map((curriculum) => (
              <option key={curriculum.id} value={curriculum.id}>
                {curriculum.code}
              </option>
            ))}
          </FilterSelect>
          <Button onClick={applySearch}>Tìm</Button>
          {hasFilters && (
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
          rowKey={(c) => c.id}
          loading={loading}
          emptyText="Chưa có môn học nào."
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
      </Card>

      <Modal
        open={showForm}
        title={editing ? `Sửa môn: ${editing.code}` : "Thêm môn học"}
        onClose={() => setShowForm(false)}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Huỷ
            </Button>
            <Button variant="primary" type="submit" form="course-form" disabled={submitting}>
              {submitting ? "Đang lưu..." : "Lưu"}
            </Button>
          </>
        }
      >
        <form id="course-form" onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <div className="col-span-1">
            <Label>Mã môn *</Label>
            <input
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] font-mono focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
              placeholder="CS101"
            />
          </div>
          <div className="col-span-1">
            <Label>Số tín chỉ</Label>
            <input
              type="number"
              min={1}
              value={form.credits}
              onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            />
          </div>
          <div className="col-span-2">
            <Label>Tên môn *</Label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
              placeholder="Nhập môn lập trình"
            />
          </div>
          <div>
            <Label>Tiết lý thuyết</Label>
            <input
              type="number"
              min={0}
              value={form.theory_hours}
              onChange={(e) => setForm({ ...form, theory_hours: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            />
          </div>
          <div>
            <Label>Tiết thực hành</Label>
            <input
              type="number"
              min={0}
              value={form.practice_hours}
              onChange={(e) => setForm({ ...form, practice_hours: Number(e.target.value) })}
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
          <div className="col-span-2">
            <Label>Môn tiên quyết</Label>
            <div className="rounded-md border border-line bg-surface p-2">
              <div className="flex flex-wrap gap-1.5 min-h-7 mb-2">
                {selectedPrerequisites.length === 0 ? (
                  <span className="text-[12.5px] text-ink-faint px-1 py-1">
                    Chưa chọn môn tiên quyết
                  </span>
                ) : (
                  selectedPrerequisites.map((course) => (
                    <span
                      key={course.id}
                      className="inline-flex items-center gap-1 rounded-full bg-white border border-line px-2 py-0.5 text-[12px]"
                    >
                      <span className="font-mono text-ink">{course.code}</span>
                      <span className="text-ink-muted max-w-[220px] truncate">{course.name}</span>
                      <button
                        type="button"
                        onClick={() => removePrerequisite(course.id)}
                        className="text-ink-faint hover:text-danger"
                        aria-label={`Bỏ ${course.code}`}
                      >
                        x
                      </button>
                    </span>
                  ))
                )}
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-card border border-line">
                <Icon name="search" size={14} className="text-ink-faint" />
                <input
                  value={prerequisiteSearch}
                  onChange={(e) => setPrerequisiteSearch(e.target.value)}
                  placeholder="Nhập mã hoặc tên môn..."
                  className="flex-1 bg-transparent outline-none text-[13px] min-w-0"
                />
              </div>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                {prerequisiteCandidates.map((course) => (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => addPrerequisite(course)}
                    className="text-left rounded-md border border-line bg-card px-2 py-1.5 hover:border-navy-300 hover:bg-navy-50"
                  >
                    <span className="font-mono text-[12px] text-ink">{course.code}</span>
                    <span className="ml-2 text-[12.5px] text-ink-muted">{course.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <label className="col-span-2 inline-flex items-center gap-2 text-[13px] cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-line-strong accent-navy-600"
            />
            <span>Đang mở (cho phép xếp lớp)</span>
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
          Bạn có chắc muốn xoá môn này? Nếu môn đã có lớp học phần hoặc nằm trong CTĐT, hệ thống
          sẽ chặn xoá.
        </p>
      </Modal>
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <div className="text-[12.5px] font-medium text-ink mb-1.5">{children}</div>;
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[11.5px] font-medium text-ink-muted mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 min-w-40 rounded-md bg-card border border-line px-2 text-[13px] outline-none focus:border-navy-400 focus:ring-2 focus:ring-navy-50"
      >
        {children}
      </select>
    </label>
  );
}
