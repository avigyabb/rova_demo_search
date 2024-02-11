from django.urls import path, include
from . import views

urlpatterns = [
    path('generate-response/', views.generate_response, name='generate_response'),
]