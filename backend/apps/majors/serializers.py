from rest_framework import serializers
from .models import Major


class MajorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Major
<<<<<<< HEAD
        fields = (
            "id", "code", "name", "department", "duration_years",
            "description", "is_active", "created_at", "updated_at",
        )
=======
        fields = ("id", "code", "name", "department", "description", "is_active", "created_at", "updated_at")
>>>>>>> 1f46ee961aae46de3dde0ef63ebc43bccbea96d6
        read_only_fields = ("id", "created_at", "updated_at")
