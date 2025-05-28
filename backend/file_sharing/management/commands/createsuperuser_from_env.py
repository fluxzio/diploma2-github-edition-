# your_app/management/commands/createsuperuser_from_env.py
import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = "Создаёт суперпользователя из переменных окружения"

    def handle(self, *args, **options):
        User = get_user_model()

        username = os.getenv("DJANGO_SUPERUSER_USERNAME")
        email = os.getenv("DJANGO_SUPERUSER_EMAIL")
        password = os.getenv("DJANGO_SUPERUSER_PASSWORD")

        if not all([username, email, password]):
            self.stderr.write(self.style.ERROR(
                "Все переменные окружения должны быть заданы."))
            return

        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.WARNING(
                f"Пользователь '{username}' уже существует."))
            return

        User.objects.create_superuser(
            username=username, email=email, password=password)
        self.stdout.write(self.style.SUCCESS(
            f"Суперпользователь '{username}' успешно создан."))
