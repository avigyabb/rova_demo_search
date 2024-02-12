from django.urls import path, include
from . import views

urlpatterns = [
    path('generate-response/', views.generate_response, name='generate_response'),
    path('copy/', views.post_copy, name='post_copy'),
    path('like/', views.post_like, name='like'),
    path('dislike/', views.post_dislike, name='dislike'),
]