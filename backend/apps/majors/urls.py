from rest_framework.routers import DefaultRouter
from .views import MajorViewSet

router = DefaultRouter()
router.register(r"majors", MajorViewSet, basename="major")

urlpatterns = router.urls
