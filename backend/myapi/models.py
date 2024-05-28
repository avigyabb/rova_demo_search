from django.db import models

class UploadedFile(models.Model):
    filename = models.CharField(max_length=255)
    file = models.FileField(upload_to='uploads/')
    file_organization = models.CharField(max_length=255, default='reference')
    upload_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.filename
    
# Model to store chat sessions
class ChatSession(models.Model):
    name = models.CharField(max_length=255)
    last_updated = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
    
# Model to store chat history
class ChatHistory(models.Model):
    user = models.CharField(max_length=255)
    message = models.TextField()
    documents = models.JSONField(default = list)
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='chats')

    def __str__(self):
        return self.user