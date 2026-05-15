import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchCurrentUser, login } from "@/api/auth";
import { useAuthStore } from "@/stores/auth";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import { extractApiError } from "@/lib/errors";

const CFG = {
  label: "Quản trị viên",
  eyebrow: "Cổng quản trị",
  headline: ["Vận hành đăng ký", "toàn trường mượt mà."] as [string, string],
  blurb:
    "Quản lý ngành đào tạo, học kỳ, lớp học phần và tài khoản người dùng. Báo cáo thống kê và gửi thông báo cho toàn hệ thống.",
  idLabel: "Tài khoản quản trị",
  idPlaceholder: "admin.daotao",
  icon: "settings" as const,
  ctaText: "Đăng nhập cổng Quản trị",
  stats: [
    ["12,840", "Người dùng"],
    ["486", "Lớp HP / kỳ"],
    ["99.97%", "Uptime hệ thống"],
  ] as [string, string][],
  help: "Truy cập cấp cao — chỉ dành cho người quản trị hệ thống.",
  accentFrom: "#1a0e2e",
  accentVia: "#3d1e6b",
  accentTo: "#5d2ea3",
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const accentColor = CFG.accentVia;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { access, refresh } = await login(username, password);
      setTokens(access, refresh);
      const me = await fetchCurrentUser();
      setUser(me);
      if (me.role !== "ADMIN") {
        useAuthStore.getState().logout();
        setError(
          "Tài khoản này không có quyền truy cập cổng quản trị. Vui lòng đăng nhập tại /login.",
        );
        return;
      }
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(extractApiError(err, "Tên đăng nhập hoặc mật khẩu không đúng."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_560px] bg-bg overflow-hidden">
      {/* Left brand pane */}
      <div
        className="relative hidden lg:flex flex-col justify-between p-14 text-white overflow-hidden"
        style={{
          background: `linear-gradient(155deg, ${CFG.accentFrom} 0%, ${CFG.accentVia} 60%, ${CFG.accentTo} 100%)`,
        }}
      >
        {/* Grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            maskImage:
              "radial-gradient(120% 100% at 30% 30%, #000 0%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(120% 100% at 30% 30%, #000 0%, transparent 70%)",
          }}
        />

        <div className="relative flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-[10px] grid place-items-center font-bold font-mono text-base text-white"
            style={{ background: accentColor }}
          >
            ĐK
          </div>
          <div>
            <div className="text-sm font-semibold">ĐKMH</div>
            <div className="text-[11.5px] text-white/55 tracking-wider uppercase">
              Hệ thống đăng ký môn học
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-2 text-[11.5px] font-semibold tracking-wider uppercase px-3 py-1.5 rounded-full bg-white/10 border border-white/15 mb-5">
            <Icon name={CFG.icon} size={13} />
            {CFG.eyebrow}
          </div>
          <h1 className="m-0 text-[44px] font-semibold leading-[1.1] tracking-tight">
            {CFG.headline[0]}
            <br />
            <span className="text-white/55">{CFG.headline[1]}</span>
          </h1>
          <p className="mt-5 max-w-[480px] text-[14.5px] text-white/70 leading-relaxed">
            {CFG.blurb}
          </p>
          <div className="mt-8 grid grid-cols-3 gap-8">
            {CFG.stats.map(([v, l]) => (
              <div key={l}>
                <div className="text-[22px] font-semibold tracking-tight">{v}</div>
                <div className="text-[11.5px] text-white/55">{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex justify-between text-xs text-white/45">
          <span>Phiên bản 2.4.1 · {CFG.label}</span>
          <span className="font-mono">SRS-DKMH v0.2</span>
        </div>
      </div>

      {/* Right form */}
      <div className="flex flex-col justify-center gap-6 p-8 lg:p-14 bg-bg overflow-y-auto">
        <div>
          <div
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: accentColor }}
          >
            Đăng nhập · {CFG.label}
          </div>
          <h2 className="mt-2 mb-1 text-[26px] font-semibold tracking-tight text-ink">
            Chào bạn quay lại
          </h2>
          <p className="m-0 text-[13.5px] text-ink-muted">
            Đăng nhập bằng tài khoản quản trị để tiếp tục.
          </p>
        </div>

        {/* Portal banner */}
        <div
          className="flex items-center gap-3 p-3.5 rounded-xl border"
          style={{
            borderColor: accentColor,
            background: `${accentColor}14`,
          }}
        >
          <div
            className="w-9 h-9 rounded-md grid place-items-center text-white flex-shrink-0"
            style={{ background: accentColor }}
          >
            <Icon name={CFG.icon} size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13.5px] font-semibold">Cổng {CFG.label}</div>
            <div className="text-[11.5px] text-ink-muted">
              Khu vực dành riêng cho người quản lý hệ thống
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3">
          <label className="block">
            <div className="text-[12.5px] font-medium text-ink mb-1.5">
              {CFG.idLabel}
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-md bg-card border border-line focus-within:border-navy-400 focus-within:ring-2 focus-within:ring-navy-50">
              <Icon name="user" size={15} className="text-ink-faint" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={CFG.idPlaceholder}
                className="flex-1 bg-transparent outline-none text-[13px] text-ink placeholder:text-ink-faint min-w-0"
                required
                autoFocus
              />
            </div>
          </label>

          <label className="block">
            <div className="text-[12.5px] font-medium text-ink mb-1.5">Mật khẩu</div>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-md bg-card border border-line focus-within:border-navy-400 focus-within:ring-2 focus-within:ring-navy-50">
              <Icon name="lock" size={15} className="text-ink-faint" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                className="flex-1 bg-transparent outline-none text-[13px] text-ink placeholder:text-ink-faint min-w-0"
                required
              />
            </div>
          </label>

          <div className="flex justify-between items-center mt-0.5">
            <label className="inline-flex items-center gap-2 text-[13px] cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-line-strong accent-navy-600"
              />
              <span>Ghi nhớ thiết bị này</span>
            </label>
            <a
              className="text-[12.5px] font-medium cursor-pointer"
              style={{ color: accentColor }}
            >
              Quên mật khẩu?
            </a>
          </div>

          {error && (
            <div className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            iconRight="arrowRight"
            disabled={loading}
            className="w-full justify-center"
            style={{ background: accentColor, borderColor: accentColor }}
          >
            {loading ? "Đang đăng nhập..." : CFG.ctaText}
          </Button>

          <div className="flex items-center gap-2.5 text-ink-faint text-[11.5px]">
            <div className="flex-1 h-px bg-line" />
            <span>HOẶC</span>
            <div className="flex-1 h-px bg-line" />
          </div>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            icon="building"
            className="w-full justify-center"
          >
            SSO Tài khoản Nhà trường
          </Button>
        </form>

        <div className="text-xs text-ink-faint text-center space-y-1">
          <div>{CFG.help}</div>
          <div>
            <Link to="/login" className="text-ink-muted hover:text-ink underline">
              ← Quay lại cổng Sinh viên / Giáo viên
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
