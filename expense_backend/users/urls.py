from django.urls import path 
from .views import RegisterView, EmailTokenObtainPairView, ProtectedTestView
from rest_framework_simplejwt.views import(
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", EmailTokenObtainPairView.as_view(), name="login"),
    path("refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("me/", ProtectedTestView.as_view(), name="me"),
]


