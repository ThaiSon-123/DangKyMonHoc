from django.db.models import Count, Q
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.classes.models import ClassSection
from .models import Registration


def _recount(class_section_id: int) -> None:
    count = Registration.objects.filter(
        class_section_id=class_section_id,
        status__in=[Registration.Status.PENDING, Registration.Status.CONFIRMED],
    ).count()
    ClassSection.objects.filter(pk=class_section_id).update(enrolled_count=count)


@receiver(post_save, sender=Registration)
def _on_save(sender, instance, **kwargs):
    _recount(instance.class_section_id)


@receiver(post_delete, sender=Registration)
def _on_delete(sender, instance, **kwargs):
    _recount(instance.class_section_id)
