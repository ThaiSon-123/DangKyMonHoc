"""Health check endpoint cho monitoring/orchestrator (Docker, K8s, load balancer).

GET /api/health/
  • 200 + {"status":"ok", ...} nếu Django + DB còn sống.
  • 503 + {"status":"unhealthy", "error":...} nếu DB không kết nối được.

Endpoint này KHÔNG yêu cầu authentication — phải public để Docker healthcheck
và external monitoring (Prometheus, UptimeRobot...) gọi được.
"""
import time

from django.db import connection, DatabaseError
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []  # bỏ JWT auth — health endpoint phải public
    throttle_classes = []         # không rate-limit health check

    def get(self, request):
        start = time.perf_counter()
        db_ok = True
        db_error = None

        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        except DatabaseError as exc:
            db_ok = False
            db_error = str(exc)

        elapsed_ms = round((time.perf_counter() - start) * 1000, 1)
        payload = {
            "status": "ok" if db_ok else "unhealthy",
            "checks": {
                "app": "ok",
                "database": "ok" if db_ok else "unhealthy",
            },
            "elapsed_ms": elapsed_ms,
        }
        if db_error:
            payload["error"] = db_error

        http_status = status.HTTP_200_OK if db_ok else status.HTTP_503_SERVICE_UNAVAILABLE
        return Response(payload, status=http_status)
