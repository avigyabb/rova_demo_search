from django.db import models

class UploadedFile(models.Model):
    filename = models.CharField(max_length=255)
    file = models.FileField(upload_to='uploads/')
    upload_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.filename
