from decimal import Decimal

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class StudentProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="student_profile"
    )
    student_code = models.CharField(max_length=16, unique=True, help_text="MSSV, vd: 21520001")
    major = models.ForeignKey(
        "majors.Major", on_delete=models.PROTECT, related_name="students"
    )
    enrollment_year = models.PositiveSmallIntegerField(help_text="Khoá tuyển sinh, vd: 2021")
    gpa = models.DecimalField(
        max_digits=4, decimal_places=2, default=Decimal("0.0"),
        validators=[MinValueValidator(Decimal("0")), MaxValueValidator(Decimal("10"))],
        help_text="Thang điểm 10",
    )
    completed_credits = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["student_code"]
        verbose_name = "Sinh viên"
        verbose_name_plural = "Sinh viên"

    def __str__(self) -> str:
        return f"{self.student_code} - {self.user.get_full_name() or self.user.username}"


class TeacherProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="teacher_profile"
    )
    teacher_code = models.CharField(max_length=16, unique=True, help_text="Mã GV, vd: GV-0142")
    department = models.CharField(max_length=200, blank=True)
    title = models.CharField(max_length=80, blank=True, help_text="Học hàm/học vị, vd: TS., ThS.")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["teacher_code"]
        verbose_name = "Giáo viên"
        verbose_name_plural = "Giáo viên"

    def __str__(self) -> str:
        return f"{self.teacher_code} - {self.title} {self.user.get_full_name()}".strip()
