from django.contrib import admin
from .models import Registration


@admin.register(Registration)
class RegistrationAdmin(admin.ModelAdmin):
    list_display = ("student", "class_section", "semester", "status", "registered_at")
    list_filter = ("status", "semester")
    search_fields = ("student__student_code", "class_section__code")
    autocomplete_fields = ("student", "class_section", "semester")
    date_hierarchy = "registered_at"
