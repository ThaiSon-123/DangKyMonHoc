import { useEffect, useMemo, useState } from "react";
import { Badge, Card, Stat, Table, type Column } from "@/components/ui";
import Icon from "@/components/ui/Icon";
import { getAdminReportsSummary, type AdminReportsSummary } from "@/api/reports";
import { listSemesters } from "@/api/semesters";
import { extractApiError } from "@/lib/errors";
import { showErrorToast } from "@/lib/toast";
import type { Semester } from "@/types/domain";

export default function AdminReportsPage() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [semesterId, setSemesterId] = useState<number | "">("");
  const [data, setData] = useState<AdminReportsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Load semesters lần đầu
  useEffect(() => {
    listSemesters({ page_size: 1000 })
      .then((r) => {
        setSemesters(r.results);
        const open = r.results.find((s) => s.is_open);
        setSemesterId(open?.id ?? r.results[0]?.id ?? "");
      })
      .catch((err) => showErrorToast(extractApiError(err, "Không tải được danh sách học kỳ.")));
  }, []);

  // Load report khi đổi semester
  useEffect(() => {
    if (!semesterId) return;
    let cancelled = false;
    setLoading(true);
    getAdminReportsSummary(Number(semesterId))
      .then((r) => {
        if (!cancelled) setData(r);
      })
      .catch((err) => {
        if (!cancelled) showErrorToast(extractApiError(err, "Không tải được báo cáo."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [semesterId]);

  // ── Computed ──
  const totalReg = useMemo(() => {
    if (!data) return 0;
    return data.registrations.confirmed + data.registrations.pending + data.registrations.cancelled;
  }, [data]);

  const fillRate = useMemo(() => {
    if (!data || data.classes.open === 0) return 0;
    return Math.round((data.classes.full / data.classes.open) * 100);
  }, [data]);

  const maxRegPerSemester = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, ...data.by_semester.map((s) => s.registrations));
  }, [data]);

  // ── Columns ──
  const courseColumns: Column<AdminReportsSummary["top_courses"][number]>[] = [
    {
      key: "rank",
      label: "#",
      width: "40px",
      align: "center",
      render: (_r, idx) => <span className="text-ink-faint">{idx + 1}</span>,
    },
    { key: "course_code", label: "Mã môn", mono: true, width: "120px" },
    {
      key: "course_name",
      label: "Tên môn",
      render: (r) => <span className="text-[13px]">{r.course_name}</span>,
    },
    {
      key: "credits",
      label: "TC",
      align: "center",
      width: "60px",
      render: (r) => <span className="font-mono">{r.credits}</span>,
    },
    {
      key: "registrations",
      label: "Đăng ký",
      align: "right",
      width: "100px",
      render: (r) => <span className="font-mono font-semibold">{r.registrations}</span>,
    },
  ];

  const majorColumns: Column<AdminReportsSummary["by_major"][number]>[] = [
    { key: "major_code", label: "Mã ngành", mono: true, width: "120px" },
    {
      key: "major_name",
      label: "Tên ngành",
      render: (r) => <span className="text-[13px]">{r.major_name}</span>,
    },
    {
      key: "students",
      label: "Số SV",
      align: "right",
      width: "100px",
      render: (r) => <span className="font-mono">{r.students}</span>,
    },
    {
      key: "registrations",
      label: "Tổng đăng ký",
      align: "right",
      width: "130px",
      render: (r) => <span className="font-mono font-semibold">{r.registrations}</span>,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="m-0 text-[22px] font-semibold tracking-tight text-ink">
            Báo cáo & thống kê
          </h1>
          <p className="mt-1 text-[13.5px] text-ink-muted">
            Tổng quan vận hành theo học kỳ — tài khoản, lớp HP, đăng ký, top môn, ngành.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[12.5px] text-ink-muted">Học kỳ:</label>
          <select
            value={semesterId}
            onChange={(e) => setSemesterId(e.target.value ? Number(e.target.value) : "")}
            className="px-3 py-1.5 rounded-md bg-card border border-line text-[13px]"
          >
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} {s.is_open ? "(đang mở)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Section 1: User stats */}
      <Card title="Tài khoản hệ thống" subtitle="Toàn hệ thống — không phụ thuộc học kỳ">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <MiniStat label="Tổng tài khoản" value={data?.users.total ?? "—"} icon="users" tone="accent" />
          <MiniStat label="Sinh viên" value={data?.users.student ?? "—"} icon="graduation" />
          <MiniStat label="Giáo viên" value={data?.users.teacher ?? "—"} icon="user" />
          <MiniStat label="Admin" value={data?.users.admin ?? "—"} icon="settings" />
          <MiniStat label="Đã khoá" value={data?.users.locked ?? "—"} icon="lock" tone={data && data.users.locked > 0 ? "danger" : "neutral"} />
        </div>
      </Card>

      {/* Section 2: Classes + Registrations stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card
          title="Lớp học phần"
          subtitle={data?.semester ? `HK ${data.semester.code}` : "—"}
        >
          <div className="space-y-3">
            <Stat
              label="Tổng số lớp HP"
              value={loading ? "…" : data?.classes.total ?? 0}
              icon="clipboard"
              tone="accent"
            />
            <div className="space-y-1.5">
              <StatusRow
                label="Đang mở (OPEN)"
                count={data?.classes.open ?? 0}
                tone="success"
              />
              <StatusRow
                label="Nháp (DRAFT)"
                count={data?.classes.draft ?? 0}
                tone="neutral"
              />
              <StatusRow
                label="Đã đóng (CLOSED)"
                count={data?.classes.closed ?? 0}
                tone="warn"
              />
              <StatusRow
                label="Huỷ"
                count={data?.classes.cancelled ?? 0}
                tone="danger"
              />
            </div>
            <div className="pt-2 border-t border-line">
              <div className="flex justify-between text-[12.5px] text-ink-muted mb-1.5">
                <span>Tỷ lệ lớp đầy</span>
                <span className="font-mono text-ink font-semibold">{fillRate}%</span>
              </div>
              <div className="h-2 rounded-full bg-surface overflow-hidden">
                <div className="h-full bg-navy-600" style={{ width: `${fillRate}%` }} />
              </div>
              <div className="mt-1 text-[11.5px] text-ink-faint">
                {data?.classes.full ?? 0} / {data?.classes.open ?? 0} lớp đầy
              </div>
            </div>
          </div>
        </Card>

        <Card
          title="Đăng ký môn học"
          subtitle={data?.semester ? `HK ${data.semester.code} · ${totalReg} bản ghi` : "—"}
        >
          <div className="space-y-3">
            <Stat
              label="Đã xác nhận (CONFIRMED)"
              value={loading ? "…" : data?.registrations.confirmed ?? 0}
              icon="check"
              tone="accent"
            />
            <div className="space-y-1.5">
              <StatusRow
                label="Chờ xác nhận"
                count={data?.registrations.pending ?? 0}
                tone="warn"
              />
              <StatusRow
                label="Đã huỷ"
                count={data?.registrations.cancelled ?? 0}
                tone="danger"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Section 3: Top courses */}
      <Card title="Top 10 môn nhiều đăng ký nhất" subtitle="Trong học kỳ đã chọn (CONFIRMED)">
        <Table
          columns={courseColumns}
          rows={data?.top_courses ?? []}
          rowKey={(r) => r.course_code}
          loading={loading}
          emptyText="Chưa có đăng ký nào trong học kỳ này."
        />
      </Card>

      {/* Section 4: By major */}
      <Card title="Thống kê theo ngành" subtitle="Số SV + đăng ký theo từng ngành đào tạo">
        <Table
          columns={majorColumns}
          rows={data?.by_major ?? []}
          rowKey={(r) => r.major_code}
          loading={loading}
          emptyText="Chưa có dữ liệu."
        />
      </Card>

      {/* Section 5: By semester (bar chart đơn giản) */}
      <Card
        title="Đăng ký qua các học kỳ"
        subtitle="10 học kỳ gần nhất — confirmed registrations"
      >
        {loading ? (
          <div className="py-6 text-center text-ink-muted">Đang tải...</div>
        ) : !data || data.by_semester.length === 0 ? (
          <div className="py-6 text-center text-ink-faint">Chưa có dữ liệu.</div>
        ) : (
          <div className="space-y-2">
            {data.by_semester.map((s) => {
              const pct = (s.registrations / maxRegPerSemester) * 100;
              return (
                <div key={s.semester_id} className="flex items-center gap-3 text-[12.5px]">
                  <span className="font-mono w-28 flex-shrink-0 text-ink-muted">
                    {s.semester_code}
                  </span>
                  <div className="flex-1 h-6 bg-surface rounded overflow-hidden relative">
                    <div
                      className="h-full bg-navy-600 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="font-mono font-semibold w-20 text-right text-ink">
                    {s.registrations.toLocaleString("vi-VN")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <p className="text-[11.5px] text-ink-faint text-center pt-2">
        Tổng số ngành đào tạo đang active: <strong>{data?.total_majors ?? "—"}</strong>
      </p>
    </div>
  );
}

function MiniStat({
  label, value, icon, tone = "neutral",
}: {
  label: string;
  value: number | string;
  icon: "users" | "graduation" | "user" | "settings" | "lock";
  tone?: "neutral" | "accent" | "danger";
}) {
  const toneCls = tone === "accent"
    ? "bg-navy-50 text-navy-600"
    : tone === "danger"
    ? "bg-red-50 text-danger"
    : "bg-surface text-ink-muted";
  return (
    <div className="px-3 py-2.5 rounded-md border border-line">
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 rounded-md grid place-items-center ${toneCls}`}>
          <Icon name={icon} size={14} />
        </div>
        <div className="text-[11.5px] text-ink-muted">{label}</div>
      </div>
      <div className="mt-1.5 text-[18px] font-semibold text-ink">{value}</div>
    </div>
  );
}

function StatusRow({
  label, count, tone,
}: {
  label: string;
  count: number;
  tone: "success" | "warn" | "danger" | "neutral";
}) {
  return (
    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-surface">
      <span className="text-[12.5px] text-ink">{label}</span>
      <Badge tone={tone}>{count.toLocaleString("vi-VN")}</Badge>
    </div>
  );
}
