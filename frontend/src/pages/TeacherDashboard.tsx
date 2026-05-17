import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Stat, Badge, Button } from "@/components/ui";
import Icon from "@/components/ui/Icon";
import { listClassSections } from "@/api/classes";
import { listRegistrations } from "@/api/registrations";
import { listGrades } from "@/api/grades";
import { listSemesters } from "@/api/semesters";
import { listNotifications, type Notification } from "@/api/notifications";
import { getMyTeacherProfile } from "@/api/teachers";
import { extractApiError } from "@/lib/errors";
import { showErrorToast } from "@/lib/toast";
import {
  WEEKDAY_LABELS,
  type ClassSection,
  type Semester,
} from "@/types/domain";

export default function TeacherDashboard() {
  const [semester, setSemester] = useState<Semester | null>(null);
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [totalRegistrations, setTotalRegistrations] = useState(0);
  const [totalGraded, setTotalGraded] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [teacher, semestersRes, notiRes] = await Promise.all([
          getMyTeacherProfile(),
          listSemesters({ page_size: 1000 }),
          listNotifications({ page: 1 }),
        ]);

        const open = semestersRes.results.find((s) => s.is_open) ?? null;
        if (cancelled) return;
        setSemester(open);
        setNotifications(notiRes.results);

        if (!open) {
          setLoading(false);
          return;
        }

        const classRes = await listClassSections({
          semester: open.id,
          teacher: teacher.id,
          page_size: 1000,
        });
        if (cancelled) return;
        setClasses(classRes.results);

        // Load registrations + grades for these classes
        const classIds = classRes.results.map((c) => c.id);
        if (classIds.length > 0) {
          const [regsRes, gradesRes] = await Promise.all([
            // Đếm tổng registrations (CONFIRMED) qua tất cả lớp HP
            Promise.all(
              classIds.map((cid) =>
                listRegistrations({
                  class_section: cid,
                  status: "CONFIRMED",
                  page_size: 1,
                }),
              ),
            ),
            Promise.all(
              classIds.map((cid) =>
                listGrades({ class_section: cid, page_size: 1000 }),
              ),
            ),
          ]);
          if (cancelled) return;
          const sumRegs = regsRes.reduce((s, r) => s + r.count, 0);
          const sumGraded = gradesRes.reduce(
            (s, r) => s + r.results.filter((g) => g.total_score !== null).length,
            0,
          );
          setTotalRegistrations(sumRegs);
          setTotalGraded(sumGraded);
        }
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

  const totalEnrolled = useMemo(
    () => classes.reduce((s, c) => s + (c.enrolled_count ?? 0), 0),
    [classes],
  );

  const avgPerClass = classes.length > 0 ? Math.round(totalEnrolled / classes.length) : 0;
  const gradingPct = totalRegistrations > 0
    ? Math.round((totalGraded / totalRegistrations) * 100)
    : 0;

  function relativeTime(iso: string): string {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "Vừa xong";
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} ngày trước`;
    return iso.replace("T", " ").slice(0, 16);
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="m-0 text-[22px] font-semibold tracking-tight text-ink">
            Tổng quan giảng dạy
          </h1>
          <p className="mt-1 text-[13.5px] text-ink-muted">
            {semester ? (
              <>
                Học kỳ: <strong className="text-ink">{semester.code}</strong> · {classes.length} lớp phụ trách
              </>
            ) : (
              "Chưa có học kỳ nào đang mở"
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/teacher/schedule">
            <Button icon="calendar">Lịch dạy</Button>
          </Link>
          <Link to="/teacher/grades">
            <Button variant="primary" icon="edit">
              Nhập điểm
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="Lớp phụ trách"
          value={loading ? "…" : classes.length}
          hint={semester?.code ?? "—"}
          icon="clipboard"
          tone="accent"
        />
        <Stat
          label="Tổng sinh viên"
          value={loading ? "…" : totalEnrolled}
          hint={`trung bình ${avgPerClass}/lớp`}
          icon="users"
        />
        <Stat
          label="Đã đăng ký"
          value={loading ? "…" : totalRegistrations}
          hint="CONFIRMED toàn bộ lớp"
          icon="doc"
        />
        <Stat
          label="Đã nhập điểm"
          value={loading ? "…" : `${gradingPct}%`}
          hint={`${totalGraded} / ${totalRegistrations} SV`}
          icon="chart"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card
          className="lg:col-span-2"
          title="Lớp phụ trách"
          subtitle={semester ? `${semester.code} · ${classes.length} lớp` : "—"}
          action={
            <Link to="/teacher/classes" className="text-[12.5px] text-navy-600 hover:underline">
              Xem tất cả →
            </Link>
          }
        >
          {loading ? (
            <div className="py-6 text-center text-ink-muted">Đang tải...</div>
          ) : classes.length === 0 ? (
            <div className="py-6 text-center text-ink-faint text-[13px]">
              Chưa có lớp nào được phân công trong học kỳ này.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {classes.slice(0, 6).map((c) => {
                const full = c.is_full;
                const firstSchedule = c.schedules[0];
                return (
                  <Link
                    key={c.id}
                    to={`/teacher/classes/${c.id}`}
                    className="border border-line rounded-lg p-3 hover:bg-surface block"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[12.5px] text-ink-muted">{c.code}</span>
                      {full ? (
                        <Badge tone="danger">Đầy</Badge>
                      ) : (
                        <Badge tone="success">
                          {c.enrolled_count}/{c.max_students}
                        </Badge>
                      )}
                    </div>
                    <div className="text-[13px] font-semibold text-ink truncate">
                      {c.course_name}
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-[11.5px] text-ink-muted flex-wrap">
                      {firstSchedule && (
                        <span className="inline-flex items-center gap-1">
                          <Icon name="calendar" size={12} />
                          {WEEKDAY_LABELS[firstSchedule.weekday]} · tiết{" "}
                          {firstSchedule.start_period}-{firstSchedule.end_period}
                        </span>
                      )}
                      {firstSchedule?.room && (
                        <span className="inline-flex items-center gap-1">
                          <Icon name="building" size={12} />
                          {firstSchedule.room}
                        </span>
                      )}
                      {c.schedules.length > 1 && (
                        <span className="text-ink-faint">+{c.schedules.length - 1} buổi</span>
                      )}
                    </div>
                  </Link>
                );
              })}
              {classes.length > 6 && (
                <Link
                  to="/teacher/classes"
                  className="border border-dashed border-line rounded-lg p-3 hover:bg-surface flex items-center justify-center text-[12.5px] text-navy-600"
                >
                  +{classes.length - 6} lớp khác →
                </Link>
              )}
            </div>
          )}
        </Card>

        <Card
          title="Thông báo mới"
          action={unreadCount > 0 ? <Badge tone="danger">{unreadCount} chưa đọc</Badge> : null}
        >
          {loading ? (
            <div className="py-6 text-center text-ink-muted">Đang tải...</div>
          ) : notifications.length === 0 ? (
            <div className="py-6 text-center text-ink-faint text-[13px]">Chưa có thông báo.</div>
          ) : (
            <ul className="space-y-2">
              {notifications.slice(0, 5).map((n) => (
                <Link
                  key={n.id}
                  to="/teacher/notifications"
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
