from rest_framework.routers import DefaultRouter
from .views import SemesterViewSet

router = DefaultRouter()
router.register(r"semesters", SemesterViewSet, basename="semester")

urlpatterns = router.urls
