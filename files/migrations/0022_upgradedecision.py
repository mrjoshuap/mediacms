from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("files", "0021_encoding_status_db_index"),
    ]

    operations = [
        migrations.CreateModel(
            name="UpgradeDecision",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("key", models.CharField(max_length=64, unique=True)),
                ("choice", models.CharField(max_length=64)),
                ("applied", models.BooleanField(default=False)),
            ],
        ),
    ]
