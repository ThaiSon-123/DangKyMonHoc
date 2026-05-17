import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Stat, Badge, Button } from "@/components/ui";
import Icon from "@/components/ui/Icon";
import { listUsers } from "@/api/users";
import { listClassSections } from "@/api/classes";
import { listRegistrations } from "@/api/registrations";
import { listSemesters } from "@/api/semesters";
import { listNotifications } from "@/api/notifications";
import { extractApiError } from "@/lib/errors";
import { showErrorToast } from "@/lib/toast";
import type { Semester } from "@/types/domain";

interface Stats {
  studentCount: number;
  teacherCount: number;
  classCount: number;
  classFullCount: number;
  registrationCount: number;
  pendingCount: number;
  cancelledCount: number;
  openSemester: Semester | null;
}

interface RecentActivity {
  id: number;
  title: string;
  body: string;
  created_at: string;
  category_display: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // 1. Lấy HK đang mở
        const semestersRes = await listSemesters({ page_size: 1000 });
        const openSemester = semestersRes.results.find((s) => s.is_open) ?? null;

        const semesterId = openSemester?.id;

        // 2. Parallel queries cho stats
        const [studentRes, teacherRes, classRes, regRes, pendingRes, cancelledRes, notiRes] = await Promise.all([
          listUsers({ role: "STUDENT", page_size: 1 }),
          listUsers({ role: "TEACHER", page_size: 1 }),
          semesterId
            ? listClassSections({ semester: semesterId, page_size: 1000 })
            : Promise.resolve({ results: [], count: 0, next: null, previous: null }),
          semesterId
            ? listRegistrations({ semester: semesterId, status: "CONFIRMED", page_size: 1 })
            : Promise.resolve({ results: [], count: 0, next: null, previous: null }),
          semesterId
            ? listRegistrations({ semester: semesterId, status: "PENDING", page_size: 1 })
            : Promise.resolve({ results: [], count: 0, next: null, previous: null }),
          semesterId
            ? listRegistrations({ semester: semesterId, status: "CANCELLED", page_size: 1 })
            : Promise.resolve({ results: [], count: 0, next: null, previous: null }),
          listNotifications({ page: 1 }),
        ]);

        if (cancelled) return;

        const classes = classRes.results;
        const classFull = classes.filter((c) => c.is_full).length;

        setStats({
          studentCount: studentRes.count,
          teacherCount: teacherRes.count,
          classCount: classRes.count,
          classFullCount: classFull,
          registrationCount: regRes.count,
          pendingCount: pendingRes.count,
          cancelledCount: cancelledRes.count,
          openSemester,
        });

        setActivities(
          notiRes.results.slice(0, 5).map((n) => ({
            id: n.id,
            title: n.title,
            body: n.body,
            created_at: n.created_at,
            category_display: n.category_display,
          })),
        );
      } catch (err) {
        if (!cancelled) showErrorToast(extractApiError(err, "Không tải được trang tổng quan."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function relativeTime(iso: string): string {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "Vừa xong";
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} ngày trước`;
    return iso.replace("T", " ").slice(0, 16);
  }

  const semesterCode = stats?.openSemester?.code ?? "—";
  const semesterLabel = stats?.openSemester
    ? `${stats.openSemester.code} · ${stats.openSemester.name}`
    : "Chưa có HK nào đang mở";

  // Phần trăm lớp đầy
  const fillRate = stats && stats.classCount > 0
    ? Math.round((stats.classFullCount / stats.classCount) * 100)
    : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="m-0 text-[22px] font-semibold tracking-tight text-ink">
            Tổng quan vận hành
          </h1>
          <p className="mt-1 text-[13.5px] text-ink-muted">
            Học kỳ hiện tại: <strong className="text-ink">{semesterLabel}</strong>
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/reports">
            <Button icon="chart">Báo cáo chi tiết</Button>
          </Link>
          <Link to="/admin/notifications">
            <Button variant="primary" icon="megaphone">
              Gửi thông báo
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="Sinh viên"
          value={loading ? "…" : (stats?.studentCount ?? 0).toLocaleString("vi-VN")}
          hint="tổng tài khoản SV"
          icon="users"
          tone="accent"
        />
        <Stat
          label="Giáo viên"
          value={loading ? "…" : (stats?.teacherCount ?? 0).toLocaleString("vi-VN")}
          hint="tổng tài khoản GV"
          icon="user"
        />
        <Stat
          label="Lớp HP đang mở"
          value={loading ? "…" : (stats?.classCount ?? 0).toLocaleString("vi-VN")}
          hint={semesterCode}
          icon="clipboard"
        />
        <Stat
          label="Đăng ký xác nhận"
          value={loading ? "…" : (stats?.registrationCount ?? 0).toLocaleString("vi-VN")}
          hint={`${stats?.pendingCount ?? 0} chờ + ${stats?.cancelledCount ?? 0} huỷ`}
          icon="doc"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card
          className="lg:col-span-2"
          title="Tình trạng đợt đăng ký"
          subtitle={semesterLabel}
          action={
            stats?.openSemester ? (
              <Badge tone="success">Đang mở</Badge>
            ) : (
              <Badge tone="neutral">Chưa mở</Badge>
            )
          }
        >
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[12.5px] text-ink-muted mb-1.5">
                <span>Tỷ lệ lớp đầy</span>
                <span className="font-mono text-ink font-semibold">{fillRate}%</span>
              </div>
              <div className="h-2 rounded-full bg-surface overflow-hidden">
                <div className="h-full bg-navy-600" style={{ width: `${fillRate}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="px-3 py-2.5 rounded-md bg-surface">
                <div className="text-[11.5px] text-ink-muted">Lớp đầy</div>
                <div className="text-xl font-semibold text-ink mt-0.5">
                  {stats?.classFullCount ?? 0}
                </div>
              </div>
              <div className="px-3 py-2.5 rounded-md bg-surface">
                <div className="text-[11.5px] text-ink-muted">Còn chỗ</div>
                <div className="text-xl font-semibold text-ink mt-0.5">
                  {Math.max(0, (stats?.classCount ?? 0) - (stats?.classFullCount ?? 0))}
                </div>
              </div>
              <div className="px-3 py-2.5 rounded-md bg-surface">
                <div className="text-[11.5px] text-ink-muted">Đã huỷ</div>
                <div className="text-xl font-semibold text-ink mt-0.5">
                  {stats?.cancelledCount ?? 0}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Lối tắt vận hành">
          <ul className="space-y-1.5">
            {[
              { to: "/admin/accounts", label: "Quản lý tài khoản", icon: "users" as const },
              { to: "/admin/classes", label: "Lớp học phần", icon: "clipboard" as const },
              { to: "/admin/registrations", label: "Đăng ký", icon: "doc" as const },
              { to: "/admin/semesters", label: "Học kỳ", icon: "calendar" as const },
              { to: "/admin/notifications", label: "Thông báo", icon: "megaphone" as const },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] text-ink hover:bg-surface"
              >
                <div className="w-7 h-7 rounded-md bg-navy-50 text-navy-600 grid place-items-center">
                  <Icon name={item.icon} size={14} />
                </div>
                <span className="flex-1">{item.label}</span>
                <Icon name="chevronRight" size={14} className="text-ink-faint" />
              </Link>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Thông báo đã gửi gần đây" action={<Link to="/admin/notifications" className="text-[12.5px] text-navy-600 hover:underline">Xem tất cả →</Link>}>
        {loading ? (
          <div className="py-6 text-center text-ink-muted">Đang tải...</div>
        ) : activities.length === 0 ? (
          <div className="py-6 text-center text-ink-faint">Chưa có thông báo nào.</div>
        ) : (
          <ul className="divide-y divide-line">
            {activities.map((a) => (
              <li key={a.id} className="flex items-start gap-3 py-2.5">
                <div className="w-8 h-8 rounded-md bg-surface text-ink-muted grid place-items-center flex-shrink-0">
                  <Icon name="megaphone" size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-ink truncate">{a.title}</div>
                  <div className="text-[12px] text-ink-muted line-clamp-1">{a.body}</div>
                </div>
                <div className="text-[11.5px] text-ink-faint flex-shrink-0">
                  {relativeTime(a.created_at)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
