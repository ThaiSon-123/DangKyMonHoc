from django.contrib import admin
from .models import Semester


@admin.register(Semester)
class SemesterAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "term", "academic_year", "start_date", "end_date", "is_open")
    list_filter = ("term", "academic_year", "is_open")
    search_fields = ("code", "name", "academic_year")
    date_hierarchy = "start_date"
