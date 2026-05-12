import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";
import type { Role } from "@/types";

const NAV_BY_ROLE: Record<Role, { to: string; label: string }[]> = {
  ADMIN: [
    { to: "/admin", label: "Tổng quan" },
    { to: "/admin/accounts", label: "Tài khoản" },
    { to: "/admin/majors", label: "Ngành đào tạo" },
    { to: "/admin/courses", label: "Môn học" },
    { to: "/admin/classes", label: "Lớp học phần" },
  ],
  STUDENT: [
    { to: "/student", label: "Tổng quan" },
    { to: "/student/register", label: "Đăng ký môn học" },
    { to: "/student/schedule", label: "Thời khóa biểu" },
  ],
  TEACHER: [
    { to: "/teacher", label: "Tổng quan" },
    { to: "/teacher/classes", label: "Lớp dạy" },
    { to: "/teacher/grades", label: "Nhập điểm" },
  ],
};

export default function Layout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const navItems = user ? NAV_BY_ROLE[user.role] : [];

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex h-full">
      <aside className="w-60 bg-slate-900 text-slate-100 flex flex-col">
        <div className="px-4 py-4 text-lg font-semibold border-b border-slate-700">
          Đăng Ký Môn Học
        </div>
        <nav className="flex-1 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `block px-4 py-2 text-sm hover:bg-slate-800 ${
                  isActive ? "bg-slate-800 text-white" : "text-slate-300"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700 text-sm">
          <div className="mb-2">
            <div className="font-medium">{user?.username}</div>
            <div className="text-xs text-slate-400">{user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-xs"
          >
            Đăng xuất
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-slate-50 p-6">
        <Outlet />
      </main>
    </div>
  );
}
