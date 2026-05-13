from django.contrib import admin
from .models import StudentProfile, TeacherProfile


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ("student_code", "user", "major", "enrollment_year", "gpa", "is_active")
    list_filter = ("major", "enrollment_year", "is_active")
    search_fields = ("student_code", "user__username", "user__email", "user__first_name", "user__last_name")
    autocomplete_fields = ("user", "major")


@admin.register(TeacherProfile)
class TeacherProfileAdmin(admin.ModelAdmin):
    list_display = ("teacher_code", "user", "department", "title", "is_active")
    list_filter = ("department", "is_active")
    search_fields = ("teacher_code", "user__username", "user__email", "department")
    autocomplete_fields = ("user",)
