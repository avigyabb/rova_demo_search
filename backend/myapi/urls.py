from django.urls import path
from .views import FileUploadView, FileDeleteView, FileListView, LlmModelView

urlpatterns = [
    path('upload/<int:is_grantapp>/', FileUploadView.as_view(), name='file-upload'),
    path('delete/<int:pk>/', FileDeleteView.as_view(), name='file-delete'),
    path('files/', FileListView.as_view(), name='file-list'),
    path('send-message/', LlmModelView.as_view(), name = "send-message")
]
