import { NavLink } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";
import type { Role } from "@/types";
import AccountMenu from "./AccountMenu";
import Icon, { type IconName } from "./ui/Icon";

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  section?: string;
}

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  ADMIN: [
    { to: "/admin", label: "Tổng quan", icon: "home" },
    { to: "/admin/accounts", label: "Tài khoản", icon: "users", section: "Đào tạo" },
    { to: "/admin/majors", label: "Ngành đào tạo", icon: "graduation" },
    { to: "/admin/curriculum", label: "Chương trình", icon: "layers" },
    { to: "/admin/courses", label: "Môn học", icon: "book" },
    { to: "/admin/semesters", label: "Học kỳ", icon: "calendar" },
    { to: "/admin/classes", label: "Lớp học phần", icon: "clipboard" },
    { to: "/admin/registrations", label: "Đăng ký", icon: "doc", section: "Vận hành" },
    { to: "/admin/reports", label: "Báo cáo", icon: "chart" },
    { to: "/admin/notifications", label: "Thông báo", icon: "megaphone" },
    { to: "/admin/settings", label: "Cấu hình", icon: "settings", section: "Hệ thống" },
  ],
  STUDENT: [
    { to: "/student", label: "Trang chủ", icon: "home" },
    { to: "/student/register", label: "Đăng ký môn", icon: "plus", section: "Học tập" },
    { to: "/student/auto", label: "Tạo TKB tự động", icon: "sparkle" },
    { to: "/student/schedule", label: "Thời khóa biểu", icon: "calendar" },
    { to: "/student/curriculum", label: "Chương trình đào tạo", icon: "layers" },
    { to: "/student/history", label: "Lịch sử đăng ký", icon: "clock" },
    { to: "/student/notifications", label: "Thông báo", icon: "bell", section: "Khác" },
    { to: "/student/profile", label: "Hồ sơ", icon: "user" },
  ],
  TEACHER: [
    { to: "/teacher", label: "Trang chủ", icon: "home" },
    { to: "/teacher/schedule", label: "Lịch dạy", icon: "calendar", section: "Giảng dạy" },
    { to: "/teacher/classes", label: "Lớp phụ trách", icon: "clipboard" },
    { to: "/teacher/grades", label: "Nhập điểm", icon: "edit" },
    { to: "/teacher/notifications", label: "Thông báo", icon: "bell", section: "Khác" },
    { to: "/teacher/profile", label: "Hồ sơ", icon: "user" },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Quản trị viên",
  STUDENT: "Sinh viên",
  TEACHER: "Giáo viên",
};

export default function Sidebar() {
  const { user } = useAuthStore();
  const navItems = user ? NAV_BY_ROLE[user.role] : [];
  const roleLabel = user ? ROLE_LABEL[user.role] : "";

  return (
    <aside className="w-60 bg-sidebar text-sidebar-text flex flex-col border-r border-white/5">
      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-white/5 flex-shrink-0">
        <div className="w-[30px] h-[30px] rounded-lg bg-navy-600 text-white grid place-items-center font-bold text-[13px] font-mono tracking-tight">
          ĐK
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-white leading-tight">ĐKMH</div>
          <div className="text-[10.5px] text-slate-400 tracking-wider uppercase">
            {roleLabel}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-auto py-3 px-3 flex flex-col gap-0.5">
        {navItems.map((item) => (
          <div key={item.to}>
            {item.section && (
              <div className="pt-3.5 px-2 pb-1.5 text-[10.5px] uppercase text-slate-500 tracking-wider font-semibold">
                {item.section}
              </div>
            )}
            <NavLink
              to={item.to}
              end={item.to === "/admin" || item.to === "/student" || item.to === "/teacher"}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-colors ${
                  isActive
                    ? "bg-navy-600 text-white font-semibold"
                    : "text-sidebar-text font-medium hover:bg-white/5"
                }`
              }
            >
              <Icon name={item.icon} size={18} />
              <span className="truncate">{item.label}</span>
            </NavLink>
          </div>
        ))}
      </nav>

      {/* User footer */}
      {user && (
        <div className="p-3 border-t border-white/5 flex-shrink-0">
          <AccountMenu placement="sidebar" />
        </div>
      )}
    </aside>
  );
}
