from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import AutoScheduleSuggestView, RegistrationViewSet

router = DefaultRouter()
router.register(r"registrations", RegistrationViewSet, basename="registration")

urlpatterns = [
    *router.urls,
    path(
        "auto-schedule/suggest/",
        AutoScheduleSuggestView.as_view(),
        name="auto-schedule-suggest",
    ),
]
