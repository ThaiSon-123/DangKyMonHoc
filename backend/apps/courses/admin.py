from django.contrib import admin
from .models import Course, Prerequisite


class PrerequisiteInline(admin.TabularInline):
    model = Prerequisite
    fk_name = "course"
    extra = 0


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "credits", "theory_hours", "practice_hours", "is_active")
    list_filter = ("is_active",)
    search_fields = ("code", "name")
    inlines = [PrerequisiteInline]
    ordering = ("code",)


@admin.register(Prerequisite)
class PrerequisiteAdmin(admin.ModelAdmin):
    list_display = ("course", "required_course", "note")
    search_fields = ("course__code", "required_course__code")
