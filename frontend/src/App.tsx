import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { fetchCurrentUser } from "@/api/auth";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import AdminDashboard from "@/pages/AdminDashboard";
import StudentDashboard from "@/pages/StudentDashboard";
import TeacherDashboard from "@/pages/TeacherDashboard";
import ProtectedRoute from "@/routes/ProtectedRoute";
import { useAuthStore } from "@/stores/auth";

function RoleHome() {
  const role = useAuthStore((s) => s.user?.role);
  if (role === "ADMIN") return <Navigate to="/admin" replace />;
  if (role === "TEACHER") return <Navigate to="/teacher" replace />;
  if (role === "STUDENT") return <Navigate to="/student" replace />;
  return <Navigate to="/login" replace />;
}

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
      <div className="min-h-full flex items-center justify-center text-slate-500">
        Đang tải...
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
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["STUDENT"]} />}>
            <Route path="/student" element={<StudentDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["TEACHER"]} />}>
            <Route path="/teacher" element={<TeacherDashboard />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
