from django.contrib import admin
from .models import Curriculum, CurriculumCourse


class CurriculumCourseInline(admin.TabularInline):
    model = CurriculumCourse
    extra = 0
    autocomplete_fields = ("course",)


@admin.register(Curriculum)
class CurriculumAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "major", "cohort_year", "total_credits_required", "is_active")
    list_filter = ("major", "cohort_year", "is_active")
    search_fields = ("code", "name")
    autocomplete_fields = ("major",)
    inlines = [CurriculumCourseInline]


@admin.register(CurriculumCourse)
class CurriculumCourseAdmin(admin.ModelAdmin):
    list_display = ("curriculum", "course", "knowledge_block", "is_required", "suggested_semester")
    list_filter = ("knowledge_block", "is_required", "suggested_semester")
    autocomplete_fields = ("curriculum", "course")
