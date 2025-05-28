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
