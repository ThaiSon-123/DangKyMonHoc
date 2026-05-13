from django.contrib import admin
from .models import Grade


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ("registration", "process_score", "midterm_score", "final_score", "total_score", "grade_letter")
    readonly_fields = ("total_score", "grade_letter", "updated_at")
    autocomplete_fields = ("registration",)
