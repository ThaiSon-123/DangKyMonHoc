from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("username", "full_name", "email", "role", "is_locked", "is_active", "is_staff")
    list_filter = ("role", "is_locked", "is_active", "is_staff")
    search_fields = ("username", "full_name", "email")
    ordering = ("username",)
    # Plan §7.2.1: dùng full_name thay first/last name
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        ("Thông tin cá nhân", {"fields": ("full_name", "email", "phone")}),
        ("Vai trò & trạng thái", {"fields": ("role", "is_locked", "is_active", "is_staff", "is_superuser")}),
        ("Quyền nâng cao", {"fields": ("groups", "user_permissions"), "classes": ("collapse",)}),
        ("Thời gian", {"fields": ("last_login", "date_joined"), "classes": ("collapse",)}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("username", "password1", "password2", "full_name", "email", "role", "phone"),
        }),
    )
