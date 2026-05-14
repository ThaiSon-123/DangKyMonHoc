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
import ProtectedRoute from "@/routes/ProtectedRoute";
import { useAuthStore } from "@/stores/auth";
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
  { path: "register", title: "Đăng ký môn học", description: "Chọn môn, chọn lớp, chọn giáo viên / ngày học mong muốn.", frId: "FR-STU-REG", icon: "plus" },
  { path: "auto", title: "Tạo TKB tự động", description: "Hệ thống đề xuất nhiều phương án TKB theo ưu tiên của bạn.", frId: "FR-STU-TKB", icon: "sparkle" },
  { path: "schedule", title: "Thời khóa biểu", description: "Xem TKB theo tuần / học kỳ, xuất file.", frId: "FR-STU-SCH", icon: "calendar" },
  { path: "curriculum", title: "Chương trình đào tạo", description: "Xem chương trình ngành, tiến độ hoàn thành.", frId: "FR-STU-CUR", icon: "layers" },
  { path: "history", title: "Lịch sử đăng ký", description: "Các môn đã đăng ký trong các học kỳ trước.", frId: "FR-STU-HIS", icon: "clock" },
  { path: "notifications", title: "Thông báo", description: "Thông báo mở / đóng đăng ký, đổi lịch, lớp hủy.", frId: "FR-STU-NOT", icon: "bell" },
  { path: "profile", title: "Hồ sơ cá nhân", description: "Thông tin cá nhân, đổi mật khẩu, liên hệ.", frId: "FR-STU-INF", icon: "user" },
];

const TEACHER_ROUTES: PlaceholderRoute[] = [
  { path: "schedule", title: "Lịch dạy cá nhân", description: "TKB giảng dạy theo tuần / học kỳ.", frId: "FR-TEA-SCH", icon: "calendar" },
  { path: "classes", title: "Lớp phụ trách", description: "Danh sách lớp được phân công, sĩ số, danh sách sinh viên.", frId: "FR-TEA-CLS", icon: "clipboard" },
  { path: "grades", title: "Nhập điểm", description: "Nhập điểm quá trình / giữa kỳ / cuối kỳ cho lớp phụ trách.", frId: "FR-TEA-GRD", icon: "edit" },
  { path: "notifications", title: "Thông báo", description: "Thông báo từ Admin, gửi thông báo cho lớp.", frId: "FR-TEA-NOT", icon: "bell" },
  { path: "profile", title: "Hồ sơ cá nhân", description: "Thông tin giảng viên, đổi mật khẩu, liên hệ.", frId: "FR-TEA-INF", icon: "user" },
];

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
  );
}
