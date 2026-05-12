import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";
import Icon from "./ui/Icon";

const BREADCRUMB_MAP: Record<string, string[]> = {
  "/admin": ["Quản trị", "Tổng quan"],
  "/admin/accounts": ["Quản trị", "Đào tạo", "Tài khoản"],
  "/admin/majors": ["Quản trị", "Đào tạo", "Ngành đào tạo"],
  "/admin/curriculum": ["Quản trị", "Đào tạo", "Chương trình"],
  "/admin/courses": ["Quản trị", "Đào tạo", "Môn học"],
  "/admin/semesters": ["Quản trị", "Đào tạo", "Học kỳ"],
  "/admin/classes": ["Quản trị", "Đào tạo", "Lớp học phần"],
  "/admin/registrations": ["Quản trị", "Vận hành", "Đăng ký"],
  "/admin/reports": ["Quản trị", "Vận hành", "Báo cáo"],
  "/admin/notifications": ["Quản trị", "Vận hành", "Thông báo"],
  "/admin/settings": ["Quản trị", "Hệ thống", "Cấu hình"],
  "/student": ["Sinh viên", "Trang chủ"],
  "/student/register": ["Sinh viên", "Học tập", "Đăng ký môn"],
  "/student/auto": ["Sinh viên", "Học tập", "Tạo TKB tự động"],
  "/student/schedule": ["Sinh viên", "Học tập", "Thời khóa biểu"],
  "/student/curriculum": ["Sinh viên", "Học tập", "Chương trình đào tạo"],
  "/student/history": ["Sinh viên", "Học tập", "Lịch sử"],
  "/student/notifications": ["Sinh viên", "Thông báo"],
  "/student/profile": ["Sinh viên", "Hồ sơ"],
  "/teacher": ["Giáo viên", "Trang chủ"],
  "/teacher/schedule": ["Giáo viên", "Giảng dạy", "Lịch dạy"],
  "/teacher/classes": ["Giáo viên", "Giảng dạy", "Lớp phụ trách"],
  "/teacher/grades": ["Giáo viên", "Giảng dạy", "Nhập điểm"],
  "/teacher/notifications": ["Giáo viên", "Thông báo"],
  "/teacher/profile": ["Giáo viên", "Hồ sơ"],
};

export default function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const breadcrumbs = BREADCRUMB_MAP[location.pathname] ?? ["Trang"];
  const initials = user
    ? `${user.last_name?.[0] ?? user.username[0]}${user.first_name?.[0] ?? ""}`.toUpperCase()
    : "?";

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="h-14 bg-card border-b border-line flex items-center pl-3 pr-5 gap-4 flex-shrink-0">
      <button
        type="button"
        className="w-8 h-8 rounded-md text-ink-muted hover:bg-surface grid place-items-center"
        aria-label="Menu"
      >
        <Icon name="menu" size={18} />
      </button>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px] flex-1 min-w-0">
        {breadcrumbs.map((b, i) => (
          <div key={i} className="flex items-center gap-1.5">
            {i > 0 && <Icon name="chevronRight" size={14} className="text-ink-faint" />}
            <span
              className={
                i === breadcrumbs.length - 1
                  ? "text-ink font-semibold whitespace-nowrap"
                  : "text-ink-muted font-medium whitespace-nowrap"
              }
            >
              {b}
            </span>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-surface border border-line w-[280px] text-ink-muted">
        <Icon name="search" size={15} />
        <span className="text-[12.5px] flex-1 truncate">
          Tìm môn học, lớp, sinh viên…
        </span>
        <kbd className="px-1.5 py-px border border-line rounded text-[10.5px] font-mono">
          ⌘K
        </kbd>
      </div>

      {/* Bell */}
      <button
        type="button"
        className="w-8 h-8 rounded-md text-ink-muted hover:bg-surface grid place-items-center relative"
        aria-label="Thông báo"
      >
        <Icon name="bell" size={18} />
        <span className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full bg-danger border-2 border-card" />
      </button>

      {/* Avatar + logout dropdown (simple) */}
      <div className="relative group">
        <button
          type="button"
          className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border border-line hover:bg-surface"
        >
          <div className="w-[26px] h-[26px] rounded-full bg-gradient-to-br from-slate-500 to-slate-900 text-white grid place-items-center text-[11px] font-semibold">
            {initials}
          </div>
          <Icon name="chevronDown" size={14} className="text-ink-muted" />
        </button>
        <div className="absolute right-0 top-full mt-1 w-44 bg-card border border-line rounded-md shadow-elevated invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity z-10">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-[13px] text-ink hover:bg-surface flex items-center gap-2"
          >
            <Icon name="lock" size={14} />
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
}
