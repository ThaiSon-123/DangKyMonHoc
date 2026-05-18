"""Tests cho health check endpoint."""
from unittest.mock import patch

from django.db import DatabaseError
from rest_framework import status
from rest_framework.test import APIClient


def test_health_check_returns_200_when_db_ok(db):
    """DB sống → trả 200 + status=ok."""
    client = APIClient()
    res = client.get("/api/health/")

    assert res.status_code == status.HTTP_200_OK
    assert res.data["status"] == "ok"
    assert res.data["checks"]["app"] == "ok"
    assert res.data["checks"]["database"] == "ok"
    assert "elapsed_ms" in res.data


def test_health_check_is_public_no_auth_required(db):
    """Health endpoint phải gọi được mà không cần JWT."""
    client = APIClient()  # KHÔNG force_authenticate
    res = client.get("/api/health/")

    assert res.status_code == status.HTTP_200_OK


def test_health_check_returns_503_when_db_down(db):
    """DB die → trả 503 + status=unhealthy + error message."""
    client = APIClient()

    with patch(
        "apps.accounts.health.connection.cursor",
        side_effect=DatabaseError("connection refused"),
    ):
        res = client.get("/api/health/")

    assert res.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    assert res.data["status"] == "unhealthy"
    assert res.data["checks"]["database"] == "unhealthy"
    assert "connection refused" in res.data["error"]
