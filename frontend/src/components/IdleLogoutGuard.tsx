import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Modal } from "./ui";
import { useAuthStore } from "@/stores/auth";
import { showInfoToast } from "@/lib/toast";
import { loginPathForPathname } from "@/lib/routes";
import {
  ACTIVITY_EVENTS,
  ACTIVITY_THROTTLE_MS,
  IDLE_TIMEOUT_MS,
  IDLE_WARNING_MS,
  LAST_ACTIVITY_KEY,
  readLastActivity,
  writeLastActivity,
} from "@/lib/idleLogout";

export default function IdleLogoutGuard() {
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const [warningOpen, setWarningOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const lastWriteRef = useRef(0);

  useEffect(() => {
    if (!accessToken) return;

    writeLastActivity();

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastWriteRef.current < ACTIVITY_THROTTLE_MS) return;
      lastWriteRef.current = now;
      writeLastActivity(now);
      setWarningOpen(false);
    };

    for (const ev of ACTIVITY_EVENTS) {
      window.addEventListener(ev, handleActivity, { passive: true });
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === LAST_ACTIVITY_KEY) {
        setWarningOpen(false);
      }
    };
    window.addEventListener("storage", onStorage);

    const interval = window.setInterval(() => {
      const idle = Date.now() - readLastActivity();
      if (idle >= IDLE_TIMEOUT_MS) {
        logout();
        setWarningOpen(false);
        showInfoToast(
          "Bạn đã bị đăng xuất sau 15 phút không hoạt động.",
          "Hết phiên"
        );
        navigate(loginPathForPathname(window.location.pathname), { replace: true });
      } else if (idle >= IDLE_WARNING_MS) {
        setSecondsLeft(Math.max(0, Math.ceil((IDLE_TIMEOUT_MS - idle) / 1000)));
        setWarningOpen(true);
      }
    }, 1000);

    return () => {
      for (const ev of ACTIVITY_EVENTS) {
        window.removeEventListener(ev, handleActivity);
      }
      window.removeEventListener("storage", onStorage);
      window.clearInterval(interval);
    };
  }, [accessToken, logout, navigate]);

  if (!accessToken) return null;

  const extendSession = () => {
    writeLastActivity();
    setWarningOpen(false);
  };

  const logoutNow = () => {
    logout();
    setWarningOpen(false);
    navigate(loginPathForPathname(window.location.pathname), { replace: true });
  };

  return (
    <Modal
      open={warningOpen}
      title="Phiên làm việc sắp hết"
      subtitle={`Bạn sẽ tự động bị đăng xuất sau ${secondsLeft} giây nếu không có thao tác.`}
      onClose={extendSession}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={logoutNow}>
            Đăng xuất ngay
          </Button>
          <Button variant="primary" onClick={extendSession}>
            Tiếp tục phiên
          </Button>
        </>
      }
    >
      <p className="text-[13.5px] text-ink">
        Vì lý do bảo mật, hệ thống sẽ tự đăng xuất các tài khoản không có hoạt động trong{" "}
        <strong>15 phút</strong>. Nhấn <strong>"Tiếp tục phiên"</strong> để giữ phiên đăng nhập.
      </p>
    </Modal>
  );
}
