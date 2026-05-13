from django.core.validators import MinValueValidator
from django.db import models


class Course(models.Model):
    code = models.CharField(max_length=16, unique=True, help_text="VD: CS101, MA202")
    name = models.CharField(max_length=200)
    credits = models.PositiveSmallIntegerField(
        default=3, validators=[MinValueValidator(1)],
        help_text="Số tín chỉ; plan §5 BR-001 quy định tối thiểu 1 TC.",
    )
    theory_hours = models.PositiveSmallIntegerField(default=0, validators=[MinValueValidator(0)])
    practice_hours = models.PositiveSmallIntegerField(default=0, validators=[MinValueValidator(0)])
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    prerequisites = models.ManyToManyField(
        "self",
        symmetrical=False,
        related_name="dependents",
        blank=True,
        through="Prerequisite",
        through_fields=("course", "required_course"),
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["code"]
        verbose_name = "Môn học"
        verbose_name_plural = "Môn học"

    def __str__(self) -> str:
        return f"{self.code} - {self.name}"


class Prerequisite(models.Model):
    """Quan hệ N-N: 1 môn có thể có nhiều môn tiên quyết."""

    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="prerequisite_links"
    )
    required_course = models.ForeignKey(
        Course, on_delete=models.PROTECT, related_name="required_by_links"
    )
    note = models.CharField(max_length=200, blank=True)

    class Meta:
        unique_together = ("course", "required_course")
        verbose_name = "Môn tiên quyết"
        verbose_name_plural = "Môn tiên quyết"

    def __str__(self) -> str:
        return f"{self.course.code} ← {self.required_course.code}"
