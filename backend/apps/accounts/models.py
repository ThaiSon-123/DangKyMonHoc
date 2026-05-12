from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.TextChoices):
    ADMIN = "ADMIN", "Admin"
    STUDENT = "STUDENT", "Sinh viên"
    TEACHER = "TEACHER", "Giáo viên"


class User(AbstractUser):
    role = models.CharField(max_length=16, choices=Role.choices, default=Role.STUDENT)
    phone = models.CharField(max_length=20, blank=True)
    is_locked = models.BooleanField(default=False)

    def __str__(self) -> str:
        return f"{self.username} ({self.get_role_display()})"
