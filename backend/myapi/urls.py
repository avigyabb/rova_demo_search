from django.urls import path
from .views import FileUploadView, FileDeleteView, FileListView, LlmModelView, ChatHistoryView, ChatHistoryDeleteView

urlpatterns = [
    path('upload/<int:is_grantapp>/', FileUploadView.as_view(), name='file-upload'),
    path('delete/<int:pk>/', FileDeleteView.as_view(), name='file-delete'),
    path('files/', FileListView.as_view(), name='file-list'),
    path('send-message/', LlmModelView.as_view(), name = "send-message"),
    path('chat-history/', ChatHistoryView.as_view(), name = "chat-history"),
    path('reset-chat/', ChatHistoryDeleteView.as_view(), name = "reset-chat"), 
]
