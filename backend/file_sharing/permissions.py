from rest_framework import permissions


class CanDeleteUser(permissions.BasePermission):
    """
    - Админ не может удалить другого админа или самого себя
    - Персонал не может удалить админов или себя
    """

    def has_object_permission(self, request, view, obj):
        # obj — это User, которого пытаются удалить

        # Нельзя удалить самого себя
        if obj.id == request.user.id:
            return False

        # Нельзя удалить админов (is_staff), кроме случая суперюзера
        if obj.is_staff:
            # Разрешим только суперюзеру сносить любого (опционально)
            if getattr(request.user, 'is_superuser', False):
                return True
            return False

        # Все остальные (staff и admin) могут удалять не-админов
        return True


class CanDeleteFile(permissions.BasePermission):
    """
    - Админ не может удалять файлы других админов.
    - Персонал не может удалять файлы других админов и других сотрудников.
    - Пользователь может удалять только свои файлы.
    """

    def has_object_permission(self, request, view, obj):
        user = request.user
        file_owner = obj.owner

        # Админ (is_staff), но не суперюзер
        if user.is_staff and not user.is_superuser:
            # не может удалять файлы других админов
            if file_owner.is_staff and file_owner.id != user.id:
                return False
            return True

        # Суперпользователь (если есть)
        if getattr(user, "is_superuser", False):
            return True  # может всё

        # Персонал ("manager" в userprofile.role)
        try:
            if hasattr(user, "userprofile") and user.userprofile.role == "manager":
                # не может удалять файлы админов и других сотрудников
                if file_owner.is_staff:
                    return False
                if hasattr(file_owner, "userprofile") and file_owner.userprofile.role == "manager" and file_owner.id != user.id:
                    return False
                return True
        except Exception:
            pass

        # Обычный пользователь — только свои файлы
        return file_owner.id == user.id
