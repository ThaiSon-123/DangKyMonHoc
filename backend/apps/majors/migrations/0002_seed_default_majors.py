"""Seed 5 ngành theo plan §4.2.2 FR-ADM-MAJ-004.

CNTT, KTPM, HTTT, KHMT, ATTT.
"""
from django.db import migrations

DEFAULT_MAJORS = [
    ("CNTT", "Công nghệ thông tin", "Khoa CNTT"),
    ("KTPM", "Kỹ thuật phần mềm", "Khoa CNTT"),
    ("HTTT", "Hệ thống thông tin", "Khoa CNTT"),
    ("KHMT", "Khoa học máy tính", "Khoa CNTT"),
    ("ATTT", "An toàn thông tin", "Khoa CNTT"),
]


def seed_majors(apps, schema_editor):
    Major = apps.get_model("majors", "Major")
    for code, name, department in DEFAULT_MAJORS:
        Major.objects.get_or_create(
            code=code,
            defaults={"name": name, "department": department, "is_active": True},
        )


def unseed_majors(apps, schema_editor):
    Major = apps.get_model("majors", "Major")
    Major.objects.filter(code__in=[c for c, *_ in DEFAULT_MAJORS]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("majors", "0001_initial"),
    ]
    operations = [
        migrations.RunPython(seed_majors, reverse_code=unseed_majors),
    ]
