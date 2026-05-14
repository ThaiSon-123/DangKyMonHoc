from django.db import models


class Semester(models.Model):
    class Term(models.IntegerChoices):
        HK1 = 1, "Học kỳ 1"
        HK2 = 2, "Học kỳ 2"
        SUMMER = 3, "Học kỳ 3"

    code = models.CharField(max_length=24, unique=True, help_text="VD: 2025-2026-HK1")
    name = models.CharField(max_length=200)
    term = models.PositiveSmallIntegerField(
        choices=Term.choices,
        help_text="1=HK1, 2=HK2, 3=HK3 (plan §7.2.9).",
    )
    academic_year = models.CharField(max_length=12, help_text="VD: 2025-2026")
    start_date = models.DateField()
    end_date = models.DateField()
    registration_start = models.DateTimeField(null=True, blank=True)
    registration_end = models.DateTimeField(null=True, blank=True)
    is_open = models.BooleanField(default=False, help_text="Học kỳ đang mở")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-start_date"]
        verbose_name = "Học kỳ"
        verbose_name_plural = "Học kỳ"

    def __str__(self) -> str:
        return f"{self.code} - {self.name}"
