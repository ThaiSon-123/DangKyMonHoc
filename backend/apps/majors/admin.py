from django.contrib import admin
from .models import Major


@admin.register(Major)
class MajorAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "department", "is_active", "updated_at")
    list_filter = ("is_active", "department")
    search_fields = ("code", "name", "department")
