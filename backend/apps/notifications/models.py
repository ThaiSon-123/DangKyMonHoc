from django.conf import settings
from django.db import models


class Notification(models.Model):
    class Audience(models.TextChoices):
        ALL_STUDENTS = "ALL_STUDENTS", "Tất cả sinh viên"
        ALL_TEACHERS = "ALL_TEACHERS", "Tất cả giáo viên"
        ALL = "ALL", "Tất cả người dùng"
        SPECIFIC = "SPECIFIC", "Danh sách cụ thể"

    class Category(models.TextChoices):
        REGISTRATION = "REGISTRATION", "Đăng ký môn học"
        SCHEDULE = "SCHEDULE", "Lịch học"
        CLASS = "CLASS", "Lớp học phần"
        SYSTEM = "SYSTEM", "Hệ thống"
        OTHER = "OTHER", "Khác"

    title = models.CharField(max_length=200)
    body = models.TextField()
    category = models.CharField(max_length=16, choices=Category.choices, default=Category.OTHER)
    audience = models.CharField(max_length=16, choices=Audience.choices, default=Audience.ALL)
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name="sent_notifications",
    )
    recipients = models.ManyToManyField(
        settings.AUTH_USER_MODEL, related_name="received_notifications", blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Thông báo"
        verbose_name_plural = "Thông báo"

    def __str__(self) -> str:
        return self.title


class NotificationRead(models.Model):
    """Đánh dấu user đã đọc notification."""

    notification = models.ForeignKey(
        Notification, on_delete=models.CASCADE, related_name="reads"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notification_reads"
    )
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("notification", "user")
