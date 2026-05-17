from django.db import migrations


def close_sections_in_closed_semesters(apps, schema_editor):
    ClassSection = apps.get_model("classes", "ClassSection")
    ClassSection.objects.filter(semester__is_open=False).exclude(
        status="CANCELLED"
    ).update(status="CLOSED")


class Migration(migrations.Migration):

    dependencies = [
        ("classes", "0003_alter_schedule_options_and_more"),
        ("semesters", "0002_term_to_integer"),
    ]

    operations = [
        migrations.RunPython(close_sections_in_closed_semesters, migrations.RunPython.noop),
    ]
