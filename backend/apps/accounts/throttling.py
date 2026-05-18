"""Rate limiting cho endpoint đăng nhập — chống brute-force."""
from django.core.cache import cache
from rest_framework.throttling import BaseThrottle

MAX_ATTEMPTS = 5
WINDOW_SECONDS = 60
LOCKOUT_SECONDS = 15 * 60


def _client_ip(request) -> str:
    """Lấy IP client, ưu tiên X-Forwarded-For nếu chạy sau reverse proxy."""
    xff = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "unknown")


class LoginRateThrottle(BaseThrottle):
    """Cho phép tối đa 5 lần thử/phút/IP. Quá ngưỡng → khoá 15 phút.

    Cơ chế:
      • Mỗi request POST /api/auth/login/ tăng counter trong cache với key theo IP.
      • Counter tự hết hạn sau 60s — nếu IP nghỉ 1 phút thì reset tự động.
      • Khi counter > 5: set thêm flag `locked:<ip>` với TTL 900s.
      • Mọi request trong khoảng lock (15 phút) đều bị từ chối ngay, không tính.
    """

    scope = "login"

    def _attempt_key(self, ip: str) -> str:
        return f"throttle:login:attempt:{ip}"

    def _lock_key(self, ip: str) -> str:
        return f"throttle:login:lock:{ip}"

    def allow_request(self, request, view) -> bool:
        ip = _client_ip(request)
        # Đang bị khoá → từ chối luôn, không tăng counter
        if cache.get(self._lock_key(ip)):
            self._retry_after = cache.ttl(self._lock_key(ip)) if hasattr(cache, "ttl") else LOCKOUT_SECONDS
            return False

        attempt_key = self._attempt_key(ip)
        try:
            attempts = cache.incr(attempt_key)
        except ValueError:
            # Key chưa tồn tại → khởi tạo với TTL = window
            cache.set(attempt_key, 1, timeout=WINDOW_SECONDS)
            attempts = 1

        if attempts > MAX_ATTEMPTS:
            cache.set(self._lock_key(ip), True, timeout=LOCKOUT_SECONDS)
            self._retry_after = LOCKOUT_SECONDS
            return False
        return True

    def wait(self):
        return getattr(self, "_retry_after", WINDOW_SECONDS)


def reset_login_throttle(request) -> None:
    """Gọi sau khi login thành công để xoá counter cho IP đó."""
    ip = _client_ip(request)
    cache.delete(f"throttle:login:attempt:{ip}")
    cache.delete(f"throttle:login:lock:{ip}")
