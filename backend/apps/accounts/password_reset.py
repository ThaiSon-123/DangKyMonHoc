"""Quên mật khẩu qua email: gửi PIN 6 số → xác thực → đổi mật khẩu.

Flow:
  1. SV/GV nhập email → POST /api/auth/forgot-password/
     - Hệ thống kiểm tra email tồn tại + role là STUDENT/TEACHER (không reset Admin qua flow này)
     - Sinh PIN 6 số, lưu cache TTL 10 phút
     - Gửi PIN qua email
     - Rate limit: 3 request/15 phút/email
  2. SV/GV nhập email + PIN + mật khẩu mới → POST /api/auth/reset-password/
     - Verify PIN khớp + chưa hết hạn
     - Validate password mới (min 8 ký tự, dùng Django password validators)
     - Đổi mật khẩu (set_password → hash PBKDF2)
     - Xoá PIN khỏi cache (chống re-use)

Email backend:
  - Render Free chặn outbound SMTP (port 25/465/587). Phải dùng HTTP API.
  - Nếu env RESEND_API_KEY được set → gửi qua Resend HTTPS API (port 443).
  - Ngược lại → fallback Django send_mail (dev local dùng console backend).
"""
import json
import logging
import secrets
import string
import urllib.error
import urllib.request

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import BaseThrottle
from rest_framework.views import APIView

logger = logging.getLogger("dkmh.password_reset")

User = get_user_model()

PIN_TTL_SECONDS = 10 * 60          # PIN sống 10 phút
PIN_LENGTH = 6
MAX_REQUESTS_PER_WINDOW = 3
WINDOW_SECONDS = 15 * 60           # Cửa sổ rate limit: 15 phút


def _pin_cache_key(email: str) -> str:
    return f"pwreset:pin:{email.lower()}"


def _attempts_cache_key(email: str) -> str:
    return f"pwreset:attempts:{email.lower()}"


def _generate_pin() -> str:
    """6 chữ số ngẫu nhiên cryptographically secure."""
    return "".join(secrets.choice(string.digits) for _ in range(PIN_LENGTH))


def _send_via_resend(api_key: str, from_email: str, to_email: str, subject: str, body: str) -> None:
    """Gửi email qua Resend HTTPS API (port 443).

    Dùng khi production trên Render (chặn outbound SMTP).
    Doc: https://resend.com/docs/api-reference/emails/send-email
    """
    payload = {
        "from": from_email,
        "to": [to_email],
        "subject": subject,
        "text": body,
    }
    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            response.read()
    except urllib.error.HTTPError as exc:
        # Resend trả 422 nếu sender email không verified, v.v.
        body_err = exc.read().decode("utf-8", errors="ignore")
        logger.error("Resend API error %s: %s", exc.code, body_err)
        raise RuntimeError(f"Resend API error: {exc.code} {body_err}") from exc
    except urllib.error.URLError as exc:
        logger.error("Resend network error: %s", exc)
        raise RuntimeError(f"Resend network error: {exc.reason}") from exc


def _send_pin_email(user: User, pin: str) -> None:
    """Gửi PIN qua email.

    - Production: Resend HTTPS API (nếu env RESEND_API_KEY set).
    - Dev/local: Django send_mail (console backend in PIN ra log).

    Subject + body tiếng Việt. PIN hết hạn 10 phút.
    """
    full_name = user.get_full_name() or user.username
    subject = "[ĐKMH] Mã xác thực đặt lại mật khẩu"
    body = (
        f"Xin chào {full_name},\n\n"
        f"Mã PIN đặt lại mật khẩu của bạn là: {pin}\n\n"
        f"Mã có hiệu lực trong 10 phút. Vui lòng KHÔNG chia sẻ mã này với bất kỳ ai.\n\n"
        f"Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.\n\n"
        f"---\nHệ thống Đăng ký Môn học"
    )

    resend_api_key = getattr(settings, "RESEND_API_KEY", "")
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "onboarding@resend.dev")

    if resend_api_key:
        _send_via_resend(resend_api_key, from_email, user.email, subject, body)
    else:
        send_mail(
            subject=subject,
            message=body,
            from_email=from_email,
            recipient_list=[user.email],
            fail_silently=False,
        )


# ───────────────────────── Throttle ─────────────────────────


class ForgotPasswordThrottle(BaseThrottle):
    """Giới hạn 3 request/15 phút/email — chống spam gửi mail."""

    def allow_request(self, request, view) -> bool:
        email = (request.data.get("email") or "").strip().lower()
        if not email:
            return True  # validation sẽ chặn ở view
        key = _attempts_cache_key(email)
        try:
            attempts = cache.incr(key)
        except ValueError:
            cache.set(key, 1, timeout=WINDOW_SECONDS)
            attempts = 1
        if attempts > MAX_REQUESTS_PER_WINDOW:
            return False
        return True

    def wait(self):
        return WINDOW_SECONDS


# ───────────────────────── Serializers ─────────────────────────


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    pin = serializers.CharField(min_length=PIN_LENGTH, max_length=PIN_LENGTH)
    new_password = serializers.CharField(min_length=8, write_only=True)

    def validate_new_password(self, value: str) -> str:
        try:
            validate_password(value)
        except ValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value


# ───────────────────────── Views ─────────────────────────


class ForgotPasswordView(APIView):
    """POST /api/auth/forgot-password/ — Gửi PIN reset password qua email.

    Validate email tồn tại trong hệ thống trước khi gửi (UX-friendly).
    Trade-off: kẻ tấn công có thể dò xem email nào tồn tại trong DB,
    nhưng đã có rate limit 3 lần/15 phút/email để giảm thiệt hại.
    """

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ForgotPasswordThrottle]

    def post(self, request):
        ser = ForgotPasswordSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        email = ser.validated_data["email"].strip().lower()

        user = User.objects.filter(email__iexact=email).first()

        # 1. Email không tồn tại
        if not user:
            return Response(
                {"detail": "Email không tồn tại trong hệ thống. Vui lòng kiểm tra lại."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # 2. Tài khoản admin → không dùng flow này
        if user.role == "ADMIN":
            return Response(
                {
                    "detail": (
                        "Tài khoản quản trị không được dùng chức năng quên mật khẩu. "
                        "Vui lòng liên hệ phòng kỹ thuật."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # 3. Tài khoản bị khóa
        if user.is_locked:
            return Response(
                {
                    "detail": (
                        "Tài khoản này đã bị khóa. Vui lòng liên hệ phòng đào tạo để được hỗ trợ."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # 4. Sinh PIN + gửi mail
        pin = _generate_pin()
        cache.set(_pin_cache_key(email), pin, timeout=PIN_TTL_SECONDS)
        try:
            _send_pin_email(user, pin)
        except Exception:
            return Response(
                {
                    "detail": (
                        "Không gửi được mã PIN đến email. Hệ thống email có thể đang gặp sự cố. "
                        "Vui lòng thử lại sau ít phút."
                    )
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            {
                "detail": (
                    f"Đã gửi mã PIN đến {user.email}. "
                    "Vui lòng kiểm tra hộp thư (cả thư mục spam) trong 10 phút."
                )
            },
            status=status.HTTP_200_OK,
        )


class ResetPasswordView(APIView):
    """POST /api/auth/reset-password/ — Xác thực PIN + đổi mật khẩu."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        ser = ResetPasswordSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        email = ser.validated_data["email"].strip().lower()
        pin = ser.validated_data["pin"]
        new_password = ser.validated_data["new_password"]

        # Tìm user
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response(
                {"detail": "Email không tồn tại trong hệ thống."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if user.role == "ADMIN":
            return Response(
                {"detail": "Tài khoản quản trị không được dùng chức năng quên mật khẩu."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if user.is_locked:
            return Response(
                {"detail": "Tài khoản này đã bị khóa. Vui lòng liên hệ phòng đào tạo."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Verify PIN
        stored = cache.get(_pin_cache_key(email))
        if not stored:
            return Response(
                {
                    "detail": (
                        "Mã PIN đã hết hạn hoặc chưa được yêu cầu. "
                        "Vui lòng quay lại bước 1 để yêu cầu mã mới."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        if stored != pin:
            return Response(
                {"detail": "Mã PIN không đúng. Vui lòng kiểm tra lại email."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Đổi mật khẩu (auto hash PBKDF2-SHA256)
        user.set_password(new_password)
        user.save(update_fields=["password"])

        # Xoá PIN khỏi cache (chống re-use) + reset rate limit counter
        cache.delete(_pin_cache_key(email))
        cache.delete(_attempts_cache_key(email))

        return Response(
            {"detail": "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập với mật khẩu mới."},
            status=status.HTTP_200_OK,
        )
