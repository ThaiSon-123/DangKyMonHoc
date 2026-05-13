from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from apps.accounts.views import LockedAwareTokenObtainPairView, LockedAwareTokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),

    # Auth
<<<<<<< HEAD
    path("api/auth/login/", LockedAwareTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", LockedAwareTokenRefreshView.as_view(), name="token_refresh"),
=======
    path("api/auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
>>>>>>> 1f46ee961aae46de3dde0ef63ebc43bccbea96d6

    # Domain APIs
    path("api/accounts/", include("apps.accounts.urls")),
    path("api/", include("apps.majors.urls")),
    path("api/", include("apps.courses.urls")),
    path("api/", include("apps.semesters.urls")),
    path("api/", include("apps.profiles.urls")),
    path("api/", include("apps.curriculums.urls")),
    path("api/", include("apps.classes.urls")),
    path("api/", include("apps.registrations.urls")),
    path("api/", include("apps.grades.urls")),
    path("api/", include("apps.notifications.urls")),

    # API docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]
