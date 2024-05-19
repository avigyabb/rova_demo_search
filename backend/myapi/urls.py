from django.urls import path
from .views import FileUploadView, FileDeleteView, FileListView

urlpatterns = [
    path('upload/<int:is_grantapp>/', FileUploadView.as_view(), name='file-upload'),
    path('delete/<int:pk>/', FileDeleteView.as_view(), name='file-delete'),
    path('files/', FileListView.as_view(), name='file-list'),
]
