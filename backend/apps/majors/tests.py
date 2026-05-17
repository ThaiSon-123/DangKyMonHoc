from rest_framework import status
from rest_framework.test import APIClient

from apps.majors.models import Major


def test_major_list_includes_duration_years(admin_user):
    Major.objects.create(
        code="AI",
        name="Artificial Intelligence",
        duration_years=5,
    )
    client = APIClient()
    client.force_authenticate(user=admin_user)

    res = client.get("/api/majors/")

    assert res.status_code == status.HTTP_200_OK
    assert res.data["results"][0]["duration_years"] == 5


def test_major_list_filters_by_department(admin_user):
    Major.objects.create(code="AI", name="Artificial Intelligence", department="Khoa Test Filter")
    Major.objects.create(code="ACC", name="Accounting", department="Khoa Kinh te")
    client = APIClient()
    client.force_authenticate(user=admin_user)

    res = client.get("/api/majors/", {"department": "Khoa Test Filter"})

    assert res.status_code == status.HTTP_200_OK
    assert [m["code"] for m in res.data["results"]] == ["AI"]
