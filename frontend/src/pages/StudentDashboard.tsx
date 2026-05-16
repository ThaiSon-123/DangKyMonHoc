import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Stat, Badge, Button } from "@/components/ui";
import Icon from "@/components/ui/Icon";
import { listRegistrations, type Registration } from "@/api/registrations";
import { listSemesters } from "@/api/semesters";
import { listNotifications, type Notification } from "@/api/notifications";
import { listGrades, type Grade } from "@/api/grades";
import { getMyCurriculum } from "@/api/curriculums";
import { useAuthStore } from "@/stores/auth";
import { extractApiError } from "@/lib/errors";
import { showErrorToast } from "@/lib/toast";
import {
  formatRegistrationWindow,
  pickActiveSemester,
  type SemesterStatus,
} from "@/lib/semester";
import type { Semester } from "@/types/domain";

export default function StudentDashboard() {
  const user = useAuthStore((s) => s.user);

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [curriculumTotal, setCurriculumTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const semestersRes = await listSemesters({ page_size: 1000 });
        const active = pickActiveSemester(semestersRes.results);

        const [regsRes, gradesRes, notisRes, curriculum] = await Promise.all([
          active.semester
            ? listRegistrations({ semester: active.semester.id, page_size: 1000 })
            : Promise.resolve({ results: [], count: 0, next: null, previous: null }),
          listGrades({ page_size: 1000 }),
          listNotifications({ page: 1 }),
          getMyCurriculum().catch(() => null),
        ]);

        if (cancelled) return;
        setSemesters(semestersRes.results);
        setRegistrations(regsRes.results);
        setGrades(gradesRes.results);
        setNotifications(notisRes.results);
        setCurriculumTotal(curriculum?.total_credits_required ?? null);
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

  const semesterPicked = useMemo(() => pickActiveSemester(semesters), [semesters]);

  // KPIs
  const confirmedRegs = useMemo(
    () => registrations.filter((r) => r.status === "CONFIRMED"),
    [registrations],
  );
  const totalCredits = confirmedRegs.reduce((s, r) => s + (r.course_credits ?? 0), 0);

  // GPA tích lũy weighted by credits (gpa_4 thang 4 + total_score thang 10)
  const { gpa, avg10, earnedCredits } = useMemo(() => {
    let sumW4 = 0;
    let sumW10 = 0;
    let sumC = 0;
    let earned = 0;
    for (const g of grades) {
      if (!g.gpa_4 || !g.total_score) continue;
      const credits = g.course_credits ?? 0;
      const v4 = parseFloat(g.gpa_4);
      const v10 = parseFloat(g.total_score);
      if (Number.isNaN(v4) || Number.isNaN(v10)) continue;
      sumW4 += v4 * credits;
      sumW10 += v10 * credits;
      sumC += credits;
      if (v4 > 0) earned += credits;
    }
    return {
      gpa: sumC > 0 ? sumW4 / sumC : null,
      avg10: sumC > 0 ? sumW10 / sumC : null,
      totalGraded: sumC,
      earnedCredits: earned,
    };
  }, [grades]);

  const completionPct = curriculumTotal && curriculumTotal > 0
    ? Math.min(100, Math.round((earnedCredits / curriculumTotal) * 100))
    : null;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  function relativeTime(iso: string): string {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "Vừa xong";
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} ngày trước`;
    return iso.replace("T", " ").slice(0, 16);
  }

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Chào buổi sáng";
    if (h < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  })();

  const semesterStatus: SemesterStatus = semesterPicked.status;
  const windowText = (() => {
    if (!semesterPicked.semester) return "Chưa có học kỳ nào đang mở";
    const win = formatRegistrationWindow(semesterPicked.semester);
    const prefix =
      semesterStatus === "active" ? "Đăng ký mở: " :
      semesterStatus === "upcoming" ? "Sắp mở đăng ký: " :
      "Học kỳ: ";
    return `${semesterPicked.semester.code} · ${prefix}${win}`;
  })();

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="m-0 text-[22px] font-semibold tracking-tight text-ink">
            {greeting}{user?.full_name ? `, ${user.full_name.split(" ").slice(-1)[0]}` : ""}
          </h1>
          <p className="mt-1 text-[13.5px] text-ink-muted">{windowText}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/student/schedule">
            <Button icon="calendar">Xem TKB</Button>
          </Link>
          <Link to="/student/auto">
            <Button variant="primary" icon="sparkle">
              Tạo TKB tự động
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="Điểm TB thang 10"
          value={loading ? "…" : avg10 !== null ? avg10.toFixed(2) : "—"}
          hint={`${confirmedRegs.length} môn kỳ này · ${totalCredits} TC`}
          icon="chart"
          tone="accent"
        />
        <Stat
          label="GPA tích lũy"
          value={loading ? "…" : gpa !== null ? gpa.toFixed(2) : "—"}
          hint="thang 4, theo tín chỉ"
          icon="graduation"
        />
        <Stat
          label="TC tích lũy"
          value={loading ? "…" : earnedCredits}
          hint={curriculumTotal ? `tổng ${curriculumTotal} TC` : "—"}
          icon="book"
        />
        <Stat
          label="Hoàn thành CTĐT"
          value={loading ? "…" : completionPct !== null ? `${completionPct}%` : "—"}
          hint={curriculumTotal ? `${earnedCredits} / ${curriculumTotal} TC` : "Chưa có CTĐT"}
          icon="layers"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card
          className="lg:col-span-2"
          title="Môn đã đăng ký"
          subtitle={
            semesterPicked.semester
              ? `${semesterPicked.semester.code} · ${confirmedRegs.length} môn · ${totalCredits} TC`
              : "—"
          }
          action={
            semesterStatus === "active" ? (
              <Badge tone="success">Đang mở</Badge>
            ) : semesterStatus === "upcoming" ? (
              <Badge tone="warn">Sắp mở</Badge>
            ) : (
              <Badge tone="neutral">Đã đóng</Badge>
            )
          }
        >
          {loading ? (
            <div className="py-6 text-center text-ink-muted">Đang tải...</div>
          ) : confirmedRegs.length === 0 ? (
            <div className="py-6 text-center text-ink-faint text-[13px]">
              Chưa đăng ký môn nào trong học kỳ này.
              <div className="mt-2">
                <Link to="/student/register" className="text-navy-600 hover:underline text-[12.5px]">
                  Vào trang đăng ký môn →
                </Link>
              </div>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {confirmedRegs.slice(0, 6).map((r) => (
                <li
                  key={r.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-md border border-line hover:bg-surface"
                >
                  <div className="font-mono text-[12px] text-ink-muted w-20 flex-shrink-0">
                    {r.course_code}
                  </div>
                  <div className="flex-1 text-[13px] text-ink truncate">{r.course_name}</div>
                  <Badge tone="accent">{r.course_credits} TC</Badge>
                  <span className="text-[11.5px] text-ink-faint font-mono w-24 text-right">
                    {r.class_section_code}
                  </span>
                </li>
              ))}
              {confirmedRegs.length > 6 && (
                <li className="text-center pt-1">
                  <Link to="/student/history" className="text-[12.5px] text-navy-600 hover:underline">
                    Xem hết {confirmedRegs.length} môn →
                  </Link>
                </li>
              )}
            </ul>
          )}
        </Card>

        <Card
          title="Thông báo mới"
          action={
            unreadCount > 0 ? <Badge tone="danger">{unreadCount} chưa đọc</Badge> : null
          }
        >
          {loading ? (
            <div className="py-6 text-center text-ink-muted">Đang tải...</div>
          ) : notifications.length === 0 ? (
            <div className="py-6 text-center text-ink-faint text-[13px]">Chưa có thông báo nào.</div>
          ) : (
            <ul className="space-y-2">
              {notifications.slice(0, 5).map((n) => (
                <Link
                  key={n.id}
                  to="/student/notifications"
                  className="flex items-start gap-2.5 px-2.5 py-2 rounded-md hover:bg-surface"
                >
                  <div className="w-7 h-7 rounded-md bg-navy-50 text-navy-600 grid place-items-center flex-shrink-0 mt-px">
                    <Icon name="bell" size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[12.5px] truncate ${n.is_read ? "text-ink-muted" : "text-ink font-semibold"}`}>
                      {n.title}
                    </div>
                    <div className="text-[11px] text-ink-faint mt-0.5">
                      {relativeTime(n.created_at)}
                    </div>
                  </div>
                </Link>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
