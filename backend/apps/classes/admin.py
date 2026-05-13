from django.contrib import admin
from .models import ClassSection, Schedule


class ScheduleInline(admin.TabularInline):
    model = Schedule
    extra = 1


@admin.register(ClassSection)
class ClassSectionAdmin(admin.ModelAdmin):
    list_display = (
        "code", "course", "semester", "teacher", "periods_per_session",
        "enrolled_count", "max_students", "status",
    )
    list_filter = ("status", "semester", "course")
    search_fields = ("code", "course__code", "course__name", "teacher__teacher_code")
    autocomplete_fields = ("course", "semester", "teacher")
    inlines = [ScheduleInline]


@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    list_display = ("class_section", "weekday", "session", "start_period", "end_period", "room")
    list_filter = ("weekday", "session")
    autocomplete_fields = ("class_section",)
