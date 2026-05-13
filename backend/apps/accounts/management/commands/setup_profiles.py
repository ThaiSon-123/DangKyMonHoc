"""Backfill StudentProfile / TeacherProfile cho User chưa có.

Usage:
    docker compose exec backend python manage.py setup_profiles
    docker compose exec backend python manage.py setup_profiles --dry-run
"""
from datetime import date

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.accounts.models import Role, User
from apps.majors.models import Major
from apps.profiles.models import StudentProfile, TeacherProfile


class Command(BaseCommand):
    help = "Tạo StudentProfile / TeacherProfile cho User thiếu profile."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", help="Chỉ in, không tạo.")

    def handle(self, *args, **opts):
        dry = opts["dry_run"]
        created_sv = []
        created_gv = []

        default_major = Major.objects.filter(is_active=True).order_by("id").first()
        current_year = date.today().year

        students = User.objects.filter(role=Role.STUDENT).exclude(student_profile__isnull=False)
        teachers = User.objects.filter(role=Role.TEACHER).exclude(teacher_profile__isnull=False)

        if not students.exists() and not teachers.exists():
            self.stdout.write(self.style.SUCCESS("Tất cả user đã có profile."))
            return

        with transaction.atomic():
            for u in students:
                code = f"SV{current_year - 2000:02d}{u.id:04d}"
                if dry:
                    created_sv.append(code)
                    continue
                if default_major is None:
                    self.stdout.write(self.style.WARNING(
                        f"⚠ Không có Major active → bỏ qua SV {u.username}. "
                        "Tạo ít nhất 1 Major trước (vd: CNTT)."
                    ))
                    continue
                StudentProfile.objects.create(
                    user=u, student_code=code, major=default_major,
                    enrollment_year=current_year,
                )
                created_sv.append(code)

            for u in teachers:
                code = f"GV{u.id:04d}"
                if dry:
                    created_gv.append(code)
                    continue
                TeacherProfile.objects.create(user=u, teacher_code=code)
                created_gv.append(code)

        verb = "[DRY-RUN]" if dry else "✓ Tạo"
        if created_sv:
            self.stdout.write(self.style.SUCCESS(
                f"{verb} {len(created_sv)} StudentProfile: {', '.join(created_sv)}"
            ))
        if created_gv:
            self.stdout.write(self.style.SUCCESS(
                f"{verb} {len(created_gv)} TeacherProfile: {', '.join(created_gv)}"
            ))
