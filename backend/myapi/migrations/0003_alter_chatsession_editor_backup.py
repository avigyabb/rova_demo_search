# Generated by Django 4.2.9 on 2024-06-25 15:41

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("myapi", "0002_chatsession_editor_backup"),
    ]

    operations = [
        migrations.AlterField(
            model_name="chatsession",
            name="editor_backup",
            field=models.TextField(blank=True, default="", null=True),
        ),
    ]
