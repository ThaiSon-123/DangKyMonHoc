import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getInitials } from "@/lib/names";
import { loginPathForRole, profilePathForRole } from "@/lib/routes";
import { useAuthStore } from "@/stores/auth";
import Icon from "./ui/Icon";

type Placement = "topbar" | "sidebar";

interface Props {
  placement: Placement;
}

export default function AccountMenu({ placement }: Props) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  if (!user) return null;

  const initials = getInitials(user.full_name || user.username);
  const displayName = user.full_name || user.username;
  const profilePath = profilePathForRole(user.role);

  function goToProfile() {
    setOpen(false);
    navigate(profilePath);
  }

  function handleLogout() {
    setOpen(false);
    const target = loginPathForRole(user?.role);
    logout();
    navigate(target, { replace: true });
  }

  return (
    <div ref={rootRef} className="relative">
      {placement === "topbar" ? (
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border border-line hover:bg-surface"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <Avatar initials={initials} size="sm" />
          <Icon name="chevronDown" size={14} className="text-ink-muted" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md bg-white/5 hover:bg-white/10 text-left"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <Avatar initials={initials} size="md" />
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] text-white font-medium leading-tight truncate">
              {displayName}
            </div>
            <div className="text-[11px] text-slate-500 font-mono truncate">
              {user.username}
            </div>
          </div>
          <Icon name="chevronDown" size={14} className="text-slate-400" />
        </button>
      )}

      {open && (
        <div
          className={`absolute z-30 w-[320px] rounded-xl border border-line bg-card p-3 shadow-elevated ${
            placement === "topbar" ? "right-0 top-full mt-2" : "left-0 bottom-full mb-2"
          }`}
          role="menu"
        >
          <MenuRow icon="user" label="Họ tên" value={displayName} />
          <MenuRow icon="doc" label="Tài khoản" value={user.username} mono />
          <button
            type="button"
            onClick={goToProfile}
            className="w-full flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-[14px] text-ink hover:bg-surface"
            role="menuitem"
          >
            <Icon name="user" size={19} className="text-ink" />
            <span>Thông tin cá nhân</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-[14px] font-semibold text-danger hover:bg-red-50"
            role="menuitem"
          >
            <Icon name="lock" size={19} />
            <span>Đăng xuất</span>
          </button>
        </div>
      )}
    </div>
  );
}

function Avatar({ initials, size }: { initials: string; size: "sm" | "md" }) {
  const className =
    size === "sm"
      ? "w-[26px] h-[26px] text-[11px]"
      : "w-[30px] h-[30px] text-xs";

  return (
    <div
      className={`${className} rounded-full bg-gradient-to-br from-slate-500 to-slate-900 text-white grid place-items-center font-semibold`}
    >
      {initials}
    </div>
  );
}

function MenuRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: "user" | "doc";
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-[14px] text-ink">
      <Icon name={icon} size={19} className="text-ink" />
      <span className="text-ink-muted">{label}:</span>
      <span className={`min-w-0 truncate font-semibold ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}
