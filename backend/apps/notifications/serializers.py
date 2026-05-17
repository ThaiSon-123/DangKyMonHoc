from rest_framework import serializers
from apps.registrations.models import Registration
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

    def validate(self, attrs):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        role = getattr(user, "role", None)

        if role == "ADMIN":
            return attrs
        if role != "STUDENT":
            raise serializers.ValidationError("Chỉ admin hoặc sinh viên được tạo thông báo.")

        recipients = attrs.get("recipients") or []
        if attrs.get("audience") != Notification.Audience.SPECIFIC:
            raise serializers.ValidationError(
                {"audience": "Sinh viên chỉ được gửi thông báo đích danh cho giáo viên."}
            )
        if not recipients:
            raise serializers.ValidationError({"recipients": "Vui lòng chọn giáo viên nhận thông báo."})
        if any(getattr(recipient, "role", None) != "TEACHER" for recipient in recipients):
            raise serializers.ValidationError(
                {"recipients": "Sinh viên chỉ được gửi thông báo cho giáo viên."}
            )
        try:
            student = user.student_profile
        except Exception:
            raise serializers.ValidationError("Tài khoản chưa có hồ sơ sinh viên.")

        allowed_teacher_user_ids = set(
            Registration.objects.filter(
                student=student,
                status=Registration.Status.CONFIRMED,
                class_section__teacher__isnull=False,
            ).values_list("class_section__teacher__user_id", flat=True)
        )
        if any(recipient.id not in allowed_teacher_user_ids for recipient in recipients):
            raise serializers.ValidationError(
                {"recipients": "Sinh viên chỉ được gửi thông báo cho giáo viên của lớp mình học."}
            )
        return attrs

    def create(self, validated_data):
        validated_data["sender"] = self.context["request"].user
        return super().create(validated_data)
