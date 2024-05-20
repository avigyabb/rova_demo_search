from django.contrib import admin
from django.urls import path, include # 👈 Add include here


urlpatterns = [
    path('admin/', admin.site.urls),
    path('vanessa-234167832602316548395014368942317931247/', include('myapi.urls')),
    path('vectordb/', include('vectordb.urls')),
]