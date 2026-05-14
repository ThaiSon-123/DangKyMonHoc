import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { fetchCurrentUser } from "@/api/auth";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import AdminDashboard from "@/pages/AdminDashboard";
import StudentDashboard from "@/pages/StudentDashboard";
import TeacherDashboard from "@/pages/TeacherDashboard";
import Placeholder from "@/pages/Placeholder";
import MajorsPage from "@/pages/admin/MajorsPage";
import CoursesPage from "@/pages/admin/CoursesPage";
import SemestersPage from "@/pages/admin/SemestersPage";
import CurriculumsPage from "@/pages/admin/CurriculumsPage";
import CurriculumDetailPage from "@/pages/admin/CurriculumDetailPage";
import ClassesPage from "@/pages/admin/ClassesPage";
import ClassDetailPage from "@/pages/admin/ClassDetailPage";
import AccountsPage from "@/pages/admin/AccountsPage";
import RegistrationsPage from "@/pages/admin/RegistrationsPage";
import NotificationsPage from "@/pages/admin/NotificationsPage";
import AdminProfilePage from "@/pages/admin/ProfilePage";
import StudentCurriculumPage from "@/pages/student/CurriculumPage";
import StudentNotificationsPage from "@/pages/student/NotificationsPage";
import StudentProfilePage from "@/pages/student/ProfilePage";
import StudentRegisterPage from "@/pages/student/RegisterPage";
import StudentSchedulePage from "@/pages/student/SchedulePage";
import StudentHistoryPage from "@/pages/student/HistoryPage";
import StudentGradesPage from "@/pages/student/GradesPage";
import TeacherProfilePage from "@/pages/teacher/ProfilePage";
import TeacherNotificationsPage from "@/pages/teacher/NotificationsPage";
import TeacherSchedulePage from "@/pages/teacher/SchedulePage";
import TeacherClassesPage from "@/pages/teacher/ClassesPage";
import TeacherClassDetailPage from "@/pages/teacher/ClassDetailPage";
import TeacherGradesPage from "@/pages/teacher/GradesPage";
import ProtectedRoute from "@/routes/ProtectedRoute";
import { useAuthStore } from "@/stores/auth";
import { ToastHost } from "@/components/ui";
import type { IconName } from "@/components/ui/Icon";

function RoleHome() {
  const role = useAuthStore((s) => s.user?.role);
  if (role === "ADMIN") return <Navigate to="/admin" replace />;
  if (role === "TEACHER") return <Navigate to="/teacher" replace />;
  if (role === "STUDENT") return <Navigate to="/student" replace />;
  return <Navigate to="/login" replace />;
}

interface PlaceholderRoute {
  path: string;
  title: string;
  description: string;
  frId?: string;
  icon?: IconName;
}

const ADMIN_ROUTES: PlaceholderRoute[] = [
  { path: "reports", title: "Báo cáo & thống kê", description: "Thống kê đăng ký theo môn, theo ngành, lớp đầy / còn chỗ.", frId: "FR-ADM-RPT", icon: "chart" },
  { path: "settings", title: "Cấu hình hệ thống", description: "Giới hạn tín chỉ, thời hạn hủy đăng ký, quy tắc nghiệp vụ.", icon: "settings" },
];

const STUDENT_ROUTES: PlaceholderRoute[] = [
  { path: "auto", title: "Tạo TKB tự động", description: "Hệ thống đề xuất nhiều phương án TKB theo ưu tiên của bạn.", frId: "FR-STU-TKB", icon: "sparkle" },
];

const TEACHER_ROUTES: PlaceholderRoute[] = [];

export default function App() {
  const { accessToken, user, setUser, logout } = useAuthStore();
  const [bootstrapping, setBootstrapping] = useState(Boolean(accessToken && !user));

  useEffect(() => {
    if (!accessToken || user) {
      setBootstrapping(false);
      return;
    }
    fetchCurrentUser()
      .then(setUser)
      .catch(() => logout())
      .finally(() => setBootstrapping(false));
  }, [accessToken, user, setUser, logout]);

  if (bootstrapping) {
    return (
      <div className="h-full flex items-center justify-center bg-bg">
        <div className="flex items-center gap-3 text-ink-muted">
          <div className="w-8 h-8 rounded-lg bg-navy-600 text-white grid place-items-center font-bold font-mono">
            ĐK
          </div>
          <span className="text-sm">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <>
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<RoleHome />} />

          <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/accounts" element={<AccountsPage />} />
            <Route path="/admin/registrations" element={<RegistrationsPage />} />
            <Route path="/admin/notifications" element={<NotificationsPage />} />
            <Route path="/admin/profile" element={<AdminProfilePage />} />
            <Route path="/admin/majors" element={<MajorsPage />} />
            <Route path="/admin/courses" element={<CoursesPage />} />
            <Route path="/admin/semesters" element={<SemestersPage />} />
            <Route path="/admin/curriculum" element={<CurriculumsPage />} />
            <Route path="/admin/curriculum/:id" element={<CurriculumDetailPage />} />
            <Route path="/admin/classes" element={<ClassesPage />} />
            <Route path="/admin/classes/:id" element={<ClassDetailPage />} />
            {ADMIN_ROUTES.map((r) => (
              <Route
                key={r.path}
                path={`/admin/${r.path}`}
                element={<Placeholder {...r} />}
              />
            ))}
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["STUDENT"]} />}>
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/curriculum" element={<StudentCurriculumPage />} />
            <Route path="/student/notifications" element={<StudentNotificationsPage />} />
            <Route path="/student/profile" element={<StudentProfilePage />} />
            <Route path="/student/register" element={<StudentRegisterPage />} />
            <Route path="/student/schedule" element={<StudentSchedulePage />} />
            <Route path="/student/history" element={<StudentHistoryPage />} />
            <Route path="/student/grades" element={<StudentGradesPage />} />
            {STUDENT_ROUTES.map((r) => (
              <Route
                key={r.path}
                path={`/student/${r.path}`}
                element={<Placeholder {...r} />}
              />
            ))}
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["TEACHER"]} />}>
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/schedule" element={<TeacherSchedulePage />} />
            <Route path="/teacher/classes" element={<TeacherClassesPage />} />
            <Route path="/teacher/classes/:id" element={<TeacherClassDetailPage />} />
            <Route path="/teacher/grades" element={<TeacherGradesPage />} />
            <Route path="/teacher/notifications" element={<TeacherNotificationsPage />} />
            <Route path="/teacher/profile" element={<TeacherProfilePage />} />
            {TEACHER_ROUTES.map((r) => (
              <Route
                key={r.path}
                path={`/teacher/${r.path}`}
                element={<Placeholder {...r} />}
              />
            ))}
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <ToastHost />
    </>
  );
}
