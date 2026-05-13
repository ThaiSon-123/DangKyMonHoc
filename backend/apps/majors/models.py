from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Major(models.Model):
    code = models.CharField(max_length=16, unique=True, help_text="VD: CNTT, KTPM, HTTT")
    name = models.CharField(max_length=200)
    department = models.CharField(max_length=200, blank=True, help_text="Khoa quản lý")
    duration_years = models.PositiveSmallIntegerField(
        default=4,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="Số năm đào tạo (plan §7.2.4).",
    )
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["code"]
        verbose_name = "Ngành đào tạo"
        verbose_name_plural = "Ngành đào tạo"

    def __str__(self) -> str:
        return f"{self.code} - {self.name}"
