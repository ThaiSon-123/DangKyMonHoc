from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    audience_display = serializers.CharField(source="get_audience_display", read_only=True)
    sender_username = serializers.CharField(source="sender.username", read_only=True, default=None)
    is_read = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = (
            "id", "title", "body", "category", "category_display",
            "audience", "audience_display", "sender", "sender_username",
            "recipients", "created_at", "is_read",
        )
        read_only_fields = ("id", "created_at", "sender")

    def get_is_read(self, obj) -> bool:
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.reads.filter(user=request.user).exists()

    def create(self, validated_data):
        validated_data["sender"] = self.context["request"].user
        return super().create(validated_data)
