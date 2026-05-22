import { useState, type FormEvent } from "react";
import { changeMyPassword } from "@/api/auth";
import { extractApiError } from "@/lib/errors";
import { showSuccessToast } from "@/lib/toast";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";

/** Card đổi mật khẩu — mặc định thu gọn, chỉ hiện form khi user click button. */
export default function ChangePasswordCard() {
  const [open, setOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  }

  function closeForm() {
    reset();
    setOpen(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!oldPassword) {
      setError("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Mật khẩu mới phải có tối thiểu 8 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (oldPassword === newPassword) {
      setError("Mật khẩu mới không được trùng với mật khẩu cũ.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await changeMyPassword({
        old_password: oldPassword,
        new_password: newPassword,
      });
      showSuccessToast(res.detail, "Đổi mật khẩu thành công");
      closeForm();
    } catch (err) {
      setError(extractApiError(err, "Không đổi được mật khẩu. Vui lòng thử lại."));
    } finally {
      setSubmitting(false);
    }
  }

  // ────── Thu gọn: chỉ hiện nút bấm ──────
  if (!open) {
    return (
      <Card title="Bảo mật tài khoản" subtitle="Quản lý mật khẩu đăng nhập của bạn.">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-md bg-surface text-ink-muted grid place-items-center flex-shrink-0">
              <Icon name="lock" size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-[13.5px] font-semibold text-ink">Mật khẩu</div>
              <div className="text-[12.5px] text-ink-muted mt-0.5">
                Đổi mật khẩu định kỳ để đảm bảo an toàn tài khoản.
              </div>
            </div>
          </div>
          <Button variant="primary" onClick={() => setOpen(true)}>
            Đổi mật khẩu
          </Button>
        </div>
      </Card>
    );
  }

  // ────── Mở rộng: hiện form ──────
  return (
    <Card
      title="Đổi mật khẩu"
      subtitle="Xác nhận mật khẩu hiện tại trước khi đặt mật khẩu mới."
    >
      <form onSubmit={handleSubmit} className="grid gap-3 max-w-md">
        <PasswordField
          label="Mật khẩu hiện tại *"
          value={oldPassword}
          onChange={setOldPassword}
          placeholder="Nhập mật khẩu đang dùng"
          show={show}
          autoFocus
        />

        <div className="h-px bg-line my-1" />

        <PasswordField
          label="Mật khẩu mới *"
          value={newPassword}
          onChange={setNewPassword}
          placeholder="Tối thiểu 8 ký tự"
          show={show}
        />
        <PasswordField
          label="Xác nhận mật khẩu mới *"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Nhập lại mật khẩu mới"
          show={show}
        />

        <label className="inline-flex items-center gap-2 text-[12.5px] text-ink-muted cursor-pointer">
          <input
            type="checkbox"
            checked={show}
            onChange={(e) => setShow(e.target.checked)}
            className="accent-navy-600"
          />
          Hiện mật khẩu
        </label>

        {error && (
          <div className="text-[13px] text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2 mt-1">
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Đang đổi..." : "Xác nhận đổi mật khẩu"}
          </Button>
          <Button type="button" variant="ghost" onClick={closeForm} disabled={submitting}>
            Huỷ
          </Button>
        </div>

        <div className="text-[11.5px] text-ink-faint mt-1">
          💡 Mẹo: dùng mật khẩu trên 8 ký tự, gồm chữ và số. Không dùng lại mật khẩu từ trang khác.
        </div>
      </form>
    </Card>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  show,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  show: boolean;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <div className="text-[12.5px] font-medium text-ink mb-1.5">{label}</div>
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-md bg-card border border-line focus-within:border-navy-400 focus-within:ring-2 focus-within:ring-navy-50">
        <Icon name="lock" size={15} className="text-ink-faint" />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required
          autoFocus={autoFocus}
          className="flex-1 bg-transparent outline-none text-[13px] text-ink placeholder:text-ink-faint min-w-0"
        />
      </div>
    </label>
  );
}
