from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viewsets import TratamientoViewSet, MedicamentoViewSet

router = DefaultRouter()
router.register(r'tratamientos', TratamientoViewSet, basename='tratamiento')
router.register(r'medicamentos', MedicamentoViewSet, basename='medicamento')

urlpatterns = [
    path('', include(router.urls)),
]