from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("username", "full_name", "email", "role", "is_locked", "is_active", "is_staff")
    list_filter = ("role", "is_locked", "is_active", "is_staff")
    fieldsets = UserAdmin.fieldsets + (
        ("Thông tin bổ sung", {"fields": ("role", "phone", "is_locked")}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Thông tin bổ sung", {"fields": ("role", "phone")}),
    )
