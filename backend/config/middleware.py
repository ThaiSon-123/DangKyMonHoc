"""Middleware đo thời gian xử lý request — cảnh báo khi vượt SLA."""
import logging
import time

logger = logging.getLogger("dkmh.perf")

SLA_SECONDS = 2.0


class ResponseTimeMiddleware:
    """Đo thời gian xử lý mọi API request và gắn header X-Response-Time-Ms.

    Nếu request chậm hơn SLA (2 giây) → log warning để monitoring/devops biết.
    Header X-Response-Time-Ms hiển thị ngay trong Chrome DevTools Network tab.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.perf_counter()
        response = self.get_response(request)
        elapsed = time.perf_counter() - start
        ms = round(elapsed * 1000, 1)
        response["X-Response-Time-Ms"] = str(ms)
        if elapsed > SLA_SECONDS and request.path.startswith("/api/"):
            logger.warning(
                "SLOW REQUEST %s %s — %sms (SLA=%ss)",
                request.method, request.path, ms, SLA_SECONDS,
            )
        return response
