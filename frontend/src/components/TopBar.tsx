import { useLocation } from "react-router-dom";
import AccountMenu from "./AccountMenu";
import NotificationBell from "./NotificationBell";
import Icon from "./ui/Icon";

const BREADCRUMB_MAP: Record<string, string[]> = {
  "/admin": ["Quản trị", "Tổng quan"],
  "/admin/accounts": ["Quản trị", "Đào tạo", "Tài khoản"],
  "/admin/majors": ["Quản trị", "Đào tạo", "Ngành đào tạo"],
  "/admin/curriculum": ["Quản trị", "Đào tạo", "Chương trình"],
  // Chi tiết CTĐT: /admin/curriculum/:id — fallback prefix match xử lý ở component
  "/admin/courses": ["Quản trị", "Đào tạo", "Môn học"],
  "/admin/semesters": ["Quản trị", "Đào tạo", "Học kỳ"],
  "/admin/classes": ["Quản trị", "Đào tạo", "Lớp học phần"],
  "/admin/registrations": ["Quản trị", "Vận hành", "Đăng ký"],
  "/admin/reports": ["Quản trị", "Vận hành", "Báo cáo"],
  "/admin/notifications": ["Quản trị", "Vận hành", "Thông báo"],
  "/admin/settings": ["Quản trị", "Hệ thống", "Cấu hình"],
  "/admin/profile": ["Quản trị", "Hồ sơ"],
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
  let breadcrumbs = BREADCRUMB_MAP[location.pathname] ?? ["Trang"];
  // Fallback prefix matching cho route con (vd. /admin/curriculum/123)
  if (breadcrumbs[0] === "Trang") {
    if (location.pathname.startsWith("/admin/curriculum/")) {
      breadcrumbs = ["Quản trị", "Đào tạo", "Chương trình", "Chi tiết"];
    } else if (location.pathname.startsWith("/admin/classes/")) {
      breadcrumbs = ["Quản trị", "Đào tạo", "Lớp học phần", "Chi tiết"];
    } else if (location.pathname.startsWith("/teacher/classes/")) {
      breadcrumbs = ["Giáo viên", "Giảng dạy", "Lớp phụ trách", "Chi tiết"];
    }
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

      <NotificationBell />
      <AccountMenu placement="topbar" />
    </header>
  );
}
