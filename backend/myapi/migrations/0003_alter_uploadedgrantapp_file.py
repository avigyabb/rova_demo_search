# Generated by Django 4.2.9 on 2024-05-19 01:10

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("myapi", "0002_uploadedgrantapp"),
    ]

    operations = [
        migrations.AlterField(
            model_name="uploadedgrantapp",
            name="file",
            field=models.FileField(upload_to="grantapps/"),
        ),
    ]
