from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.TextChoices):
    ADMIN = "ADMIN", "Admin"
    STUDENT = "STUDENT", "Sinh viên"
    TEACHER = "TEACHER", "Giáo viên"


class User(AbstractUser):
    """Plan §7.2.1: dùng `full_name` thay cho first_name/last_name.

    AbstractUser vẫn giữ first_name/last_name (kế thừa từ Django) nhưng codebase
    không dùng đến — toàn bộ API/UI thao tác qua `full_name`.
    """

    full_name = models.CharField(max_length=200, blank=True, help_text="Họ và tên đầy đủ.")
    role = models.CharField(max_length=16, choices=Role.choices, default=Role.STUDENT)
    phone = models.CharField(max_length=20, blank=True)
    is_locked = models.BooleanField(default=False)

    def get_full_name(self) -> str:
        # Override AbstractUser.get_full_name() để trả về full_name field
        return self.full_name or self.username

    def get_short_name(self) -> str:
        # Lấy phần cuối làm "tên" (vd. "Nguyễn Văn An" → "An")
        return self.full_name.split()[-1] if self.full_name else self.username

    def __str__(self) -> str:
        return f"{self.username} ({self.get_role_display()})"
