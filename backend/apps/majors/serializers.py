from rest_framework import serializers
from .models import Major


class MajorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Major
        fields = ("id", "code", "name", "department", "description", "is_active", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")
