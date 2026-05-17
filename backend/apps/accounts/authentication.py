from django.utils.translation import gettext_lazy as _
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed

from .serializers import LOCKED_ACCOUNT_MESSAGE


class LockedAwareJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        if user.is_locked:
            raise AuthenticationFailed(_(LOCKED_ACCOUNT_MESSAGE), code="user_locked")
        return user
