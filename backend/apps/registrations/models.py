from django.db import models


class Registration(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Chờ xác nhận"
        CONFIRMED = "CONFIRMED", "Đã đăng ký"
        CANCELLED = "CANCELLED", "Đã huỷ"

    student = models.ForeignKey(
        "profiles.StudentProfile", on_delete=models.CASCADE, related_name="registrations"
    )
    class_section = models.ForeignKey(
        "classes.ClassSection", on_delete=models.PROTECT, related_name="registrations"
    )
    semester = models.ForeignKey(
        "semesters.Semester", on_delete=models.PROTECT, related_name="registrations"
    )
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)
    registered_at = models.DateTimeField(auto_now_add=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancel_reason = models.CharField(max_length=200, blank=True)

    class Meta:
        unique_together = ("student", "class_section")
        ordering = ["-registered_at"]
        verbose_name = "Đăng ký môn"
        verbose_name_plural = "Đăng ký môn"
        indexes = [
            models.Index(fields=["student", "semester"], name="reg_student_sem_idx"),
            models.Index(fields=["class_section", "status"], name="reg_cs_status_idx"),
            models.Index(fields=["semester", "status"], name="reg_sem_status_idx"),
        ]

    def save(self, *args, **kwargs):
        """Đồng bộ semester theo class_section.semester để tránh data lệch."""
        if self.class_section_id and (
            self.semester_id is None or self.semester_id != self.class_section.semester_id
        ):
            self.semester = self.class_section.semester
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.student.student_code} → {self.class_section.code} ({self.status})"
