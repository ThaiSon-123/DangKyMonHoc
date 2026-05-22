import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword, resetPassword } from "@/api/auth";
import { extractApiError } from "@/lib/errors";
import { showSuccessToast } from "@/lib/toast";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";

type Step = "request" | "verify" | "done";

const ACCENT_FROM = "#0e1c33";
const ACCENT_VIA = "#1e3a5f";
const ACCENT_TO = "#2a4d7f";
const ACCENT_COLOR = "#1e3a5f";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleRequestPin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      const data = await forgotPassword(email.trim());
      setInfo(data.detail);
      setStep("verify");
    } catch (err) {
      setError(extractApiError(err, "Không gửi được mã PIN. Vui lòng thử lại."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("Mật khẩu mới phải tối thiểu 8 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (!/^\d{6}$/.test(pin)) {
      setError("Mã PIN phải là 6 chữ số.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword({
        email: email.trim(),
        pin: pin.trim(),
        new_password: newPassword,
      });
      setStep("done");
      showSuccessToast(
        "Mật khẩu đã được đổi. Bạn có thể đăng nhập với mật khẩu mới.",
        "Đặt lại mật khẩu thành công",
      );
    } catch (err) {
      setError(extractApiError(err, "Không đặt lại được mật khẩu. Kiểm tra mã PIN."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_560px] bg-bg overflow-hidden">
      {/* Left brand pane */}
      <div
        className="relative hidden lg:flex flex-col justify-between p-14 text-white overflow-hidden"
        style={{
          background: `linear-gradient(155deg, ${ACCENT_FROM} 0%, ${ACCENT_VIA} 60%, ${ACCENT_TO} 100%)`,
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
            style={{ background: ACCENT_COLOR }}
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
            <Icon name="lock" size={13} />
            Khôi phục tài khoản
          </div>
          <h1 className="m-0 text-[44px] font-semibold leading-[1.1] tracking-tight">
            Quên mật khẩu?
            <br />
            <span className="text-white/55">Không sao cả.</span>
          </h1>
          <p className="mt-5 max-w-[480px] text-[14.5px] text-white/70 leading-relaxed">
            Chúng tôi sẽ gửi mã PIN gồm 6 chữ số đến email đăng ký của bạn.
            Mã có hiệu lực trong 10 phút và chỉ dùng được 1 lần.
          </p>

          {/* Step indicator */}
          <div className="mt-8 space-y-3">
            <BrandStep
              num={1}
              label="Nhập email đã đăng ký"
              active={step === "request"}
              done={step !== "request"}
            />
            <BrandStep
              num={2}
              label="Nhập mã PIN + mật khẩu mới"
              active={step === "verify"}
              done={step === "done"}
            />
            <BrandStep
              num={3}
              label="Đăng nhập với mật khẩu mới"
              active={step === "done"}
              done={false}
            />
          </div>
        </div>

        <div className="relative flex justify-between text-xs text-white/45">
          <span>Phiên bản 2.4.1 · Khôi phục mật khẩu</span>
          <span className="font-mono">SRS-DKMH v0.2</span>
        </div>
      </div>

      {/* Right form */}
      <div className="flex flex-col justify-center gap-6 p-8 lg:p-14 bg-bg overflow-y-auto">
        <div>
          <div
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: ACCENT_COLOR }}
          >
            Đặt lại mật khẩu
          </div>
          <h2 className="mt-2 mb-1 text-[26px] font-semibold tracking-tight text-ink">
            {step === "request" && "Nhập email của bạn"}
            {step === "verify" && "Xác thực và đổi mật khẩu"}
            {step === "done" && "Đặt lại thành công"}
          </h2>
          <p className="m-0 text-[13.5px] text-ink-muted">
            {step === "request" &&
              "Chúng tôi sẽ gửi mã PIN 6 số đến email đã đăng ký với hệ thống."}
            {step === "verify" &&
              "Kiểm tra hộp thư (cả thư mục spam) để lấy mã PIN."}
            {step === "done" && "Hãy quay lại đăng nhập với mật khẩu mới."}
          </p>
        </div>

        {/* Info box */}
        <div
          className="flex items-center gap-3 p-3.5 rounded-xl border"
          style={{
            borderColor: ACCENT_COLOR,
            background: `${ACCENT_COLOR}14`,
          }}
        >
          <div
            className="w-9 h-9 rounded-md grid place-items-center text-white flex-shrink-0"
            style={{ background: ACCENT_COLOR }}
          >
            <Icon name="lock" size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13.5px] font-semibold">Bảo mật tài khoản</div>
            <div className="text-[11.5px] text-ink-muted">
              Mã PIN dùng 1 lần, hết hạn sau 10 phút. Không chia sẻ với bất kỳ ai.
            </div>
          </div>
        </div>

        {/* Step 1: nhập email */}
        {step === "request" && (
          <form onSubmit={handleRequestPin} className="grid gap-3">
            <label className="block">
              <div className="text-[12.5px] font-medium text-ink mb-1.5">
                Email đã đăng ký
              </div>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-md bg-card border border-line focus-within:border-navy-400 focus-within:ring-2 focus-within:ring-navy-50">
                <Icon name="user" size={15} className="text-ink-faint" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vd. svxxx@school.edu.vn"
                  className="flex-1 bg-transparent outline-none text-[13px] text-ink placeholder:text-ink-faint min-w-0"
                  required
                  autoFocus
                />
              </div>
            </label>

            {error && (
              <div className="text-[13px] text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              className="w-full mt-2"
            >
              {submitting ? "Đang gửi..." : "Gửi mã PIN →"}
            </Button>

            <div className="text-center text-[12.5px] text-ink-muted mt-1">
              Đã nhớ ra mật khẩu?{" "}
              <Link
                to="/login"
                className="font-medium hover:underline"
                style={{ color: ACCENT_COLOR }}
              >
                Quay lại đăng nhập
              </Link>
            </div>
          </form>
        )}

        {/* Step 2: nhập PIN + mật khẩu mới */}
        {step === "verify" && (
          <form onSubmit={handleResetPassword} className="grid gap-3">
            {info && (
              <div className="text-[12.5px] text-ink bg-blue-50 border border-blue-200 rounded-md px-3 py-2.5">
                {info}
              </div>
            )}

            <label className="block">
              <div className="text-[12.5px] font-medium text-ink mb-1.5">
                Email
              </div>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-md bg-surface border border-line">
                <Icon name="user" size={15} className="text-ink-faint" />
                <input
                  type="email"
                  value={email}
                  disabled
                  className="flex-1 bg-transparent outline-none text-[13px] text-ink-muted min-w-0"
                />
              </div>
            </label>

            <label className="block">
              <div className="text-[12.5px] font-medium text-ink mb-1.5">
                Mã PIN (6 số)
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full px-3 py-2.5 rounded-md bg-card border border-line text-[18px] font-mono tracking-[0.4em] text-center focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
              />
            </label>

            <label className="block">
              <div className="text-[12.5px] font-medium text-ink mb-1.5">
                Mật khẩu mới
              </div>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-md bg-card border border-line focus-within:border-navy-400 focus-within:ring-2 focus-within:ring-navy-50">
                <Icon name="lock" size={15} className="text-ink-faint" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 8 ký tự"
                  className="flex-1 bg-transparent outline-none text-[13px] text-ink min-w-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-ink-faint hover:text-ink p-0.5"
                  tabIndex={-1}
                >
                  <Icon name={showPassword ? "x" : "user"} size={14} />
                </button>
              </div>
            </label>

            <label className="block">
              <div className="text-[12.5px] font-medium text-ink mb-1.5">
                Xác nhận mật khẩu
              </div>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-md bg-card border border-line focus-within:border-navy-400 focus-within:ring-2 focus-within:ring-navy-50">
                <Icon name="lock" size={15} className="text-ink-faint" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  className="flex-1 bg-transparent outline-none text-[13px] text-ink min-w-0"
                />
              </div>
            </label>

            {error && (
              <div className="text-[13px] text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              className="w-full mt-2"
            >
              {submitting ? "Đang đặt lại..." : "Đặt lại mật khẩu →"}
            </Button>

            <div className="flex items-center justify-between text-[12.5px] mt-1">
              <button
                type="button"
                onClick={() => {
                  setStep("request");
                  setPin("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setError(null);
                }}
                className="text-ink-muted hover:text-ink"
              >
                ← Đổi email khác
              </button>
              <Link
                to="/login"
                className="font-medium hover:underline"
                style={{ color: ACCENT_COLOR }}
              >
                Quay lại đăng nhập
              </Link>
            </div>
          </form>
        )}

        {/* Step 3: thành công */}
        {step === "done" && (
          <div className="grid gap-5 text-center py-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 grid place-items-center">
              <Icon name="check" size={32} className="text-emerald-600" />
            </div>
            <div>
              <div className="text-[16px] font-semibold text-ink">
                Mật khẩu đã được đổi thành công
              </div>
              <p className="text-[13px] text-ink-muted mt-1.5">
                Bạn có thể đăng nhập với mật khẩu mới ngay bây giờ.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate("/login")}
              className="w-full"
            >
              Đi đến trang đăng nhập →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function BrandStep({
  num,
  label,
  active,
  done,
}: {
  num: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-7 h-7 rounded-full grid place-items-center text-[12px] font-bold transition-colors flex-shrink-0 ${
          done
            ? "bg-emerald-500 text-white"
            : active
            ? "bg-white text-navy-700"
            : "bg-white/10 text-white/40 border border-white/15"
        }`}
      >
        {done ? "✓" : num}
      </div>
      <span
        className={`text-[13.5px] transition-colors ${
          active ? "text-white font-medium" : done ? "text-white/70" : "text-white/40"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
