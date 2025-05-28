import { Navigate } from "react-router-dom";
import { useSession } from "../providers/useSession";
import type { JSX } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

interface Props {
  children: JSX.Element;
  adminOnly?: boolean;
}

const ProtectedRoute = ({ children, adminOnly = false }: Props) => {
  const { isAuthenticated, isLoading, user } = useSession();

  // Пока идет проверка токена — ничего не рендерим
  if (isLoading) {
    return <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <CircularProgress />
      <Typography variant="h6" sx={{ mt: 2 }}>
        Проверка токена...
      </Typography>
    </Box>
  }

  // Если не авторизован — перенаправить на login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !(user?.is_staff || user?.is_superuser)) {
		return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
