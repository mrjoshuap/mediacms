from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("files", "0022_upgradedecision"),
    ]

    operations = [
        migrations.AlterField(
            model_name="media",
            name="password",
            field=models.CharField(
                blank=True,
                help_text="Hashed password for password-protected media (Django password hashers)",
                max_length=255,
            ),
        ),
    ]
