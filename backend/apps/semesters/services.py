from django.utils import timezone


def close_class_sections_for_semester(semester):
    from apps.classes.models import ClassSection

    return (
        semester.class_sections.exclude(status=ClassSection.Status.CANCELLED)
        .exclude(status=ClassSection.Status.CLOSED)
        .update(status=ClassSection.Status.CLOSED, updated_at=timezone.now())
    )
