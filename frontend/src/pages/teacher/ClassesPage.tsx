import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, Stat, Table, type Column } from "@/components/ui";
import { listClassSections } from "@/api/classes";
import { getMyTeacherProfile } from "@/api/teachers";
import { listSemesters } from "@/api/semesters";
import { extractApiError } from "@/lib/errors";
import {

  type ClassSection,
  type ClassStatus,
  type Semester,
} from "@/types/domain";

const STATUS_TONE: Record<ClassStatus, "neutral" | "success" | "warn" | "danger"> = {
  DRAFT: "neutral",
  OPEN: "success",
  CLOSED: "warn",
  CANCELLED: "danger",
};

export default function TeacherClassesPage() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<number | "">("");
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teacherId, setTeacherId] = useState<number | null>(null);

  useEffect(() => {
    getMyTeacherProfile()
      .then((t) => setTeacherId(t.id))
      .catch((err) => setError(extractApiError(err, "Không tải được hồ sơ.")));
  }, []);

  useEffect(() => {
    listSemesters({ page_size: 1000 })
      .then((r) => {
        setSemesters(r.results);
        const openSem = r.results.find((s) => s.is_open);
        setSelectedSemester(openSem?.id ?? r.results[0]?.id ?? "");
      })
      .catch((err) => setError(extractApiError(err, "Không tải được học kỳ.")));
  }, []);

  const refresh = useCallback(async () => {
    if (!teacherId) return;
    setLoading(true);
    try {
      const params: Parameters<typeof listClassSections>[0] = {
        teacher: teacherId,
        page_size: 1000,
      };
      if (selectedSemester) params.semester = selectedSemester;
      const data = await listClassSections(params);
      setClasses(data.results);
    } catch (err) {
      setError(extractApiError(err, "Không tải được lớp."));
    } finally {
      setLoading(false);
    }
  }, [teacherId, selectedSemester]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const totalStudents = classes.reduce((s, c) => s + c.enrolled_count, 0);
  const openClasses = classes.filter((c) => c.status === "OPEN").length;

  const columns: Column<ClassSection>[] = [
    {
      key: "code",
      label: "Mã lớp",
      mono: true,
      width: "120px",
      render: (cs) => (
        <Link
          to={`/teacher/classes/${cs.id}`}
          className="text-navy-600 hover:underline font-medium"
        >
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
    {
      key: "course_credits",
      label: "TC",
      align: "center",
      width: "60px",
      render: (cs) => <span className="font-mono">{cs.course_credits}</span>,
    },
    { key: "semester_code", label: "Học kỳ", mono: true, width: "140px" },
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
      key: "schedules",
      label: "Lịch",
      align: "center",
      width: "80px",
      render: (cs) => <Badge tone="accent">{cs.schedules.length} buổi</Badge>,
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
      width: "180px",
      align: "right",
      render: (cs) => (
        <div className="flex justify-end gap-1">
          <Link to={`/teacher/classes/${cs.id}`}>
            <Button size="sm" variant="ghost" icon="users">
              Sinh viên
            </Button>
          </Link>
          <Link to={`/teacher/grades?class=${cs.id}`}>
            <Button size="sm" variant="ghost" icon="edit">
              Nhập điểm
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h1 className="m-0 text-[22px] font-semibold tracking-tight text-ink">
            Lớp phụ trách
          </h1>
          <p className="mt-1 text-[13.5px] text-ink-muted">
            Danh sách các lớp học phần bạn được phân công giảng dạy. Click mã lớp để xem chi tiết
            sinh viên.
          </p>
        </div>
        <select
          value={selectedSemester}
          onChange={(e) =>
            setSelectedSemester(e.target.value === "" ? "" : Number(e.target.value))
          }
          className="px-3 py-2 rounded-md bg-card border border-line text-[13px] min-w-[250px]"
        >
          <option value="">Tất cả học kỳ</option>
          {semesters.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code} - {s.name}
              {s.is_open ? " (đang mở)" : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Tổng lớp" value={classes.length} icon="clipboard" tone="accent" />
        <Stat label="Đang mở" value={openClasses} icon="check" />
        <Stat label="Tổng SV" value={totalStudents} icon="users" />
      </div>

      {error && (
        <div className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <Card>
        <Table
          columns={columns}
          rows={classes}
          rowKey={(cs) => cs.id}
          loading={loading}
          emptyText="Bạn chưa được phân công lớp nào."
        />
      </Card>
    </div>
  );
}
