import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  InputAdornment,
  CircularProgress,
  Link as MuiLink,
} from '@mui/material';
import { Person as UserIcon, Lock as LockIcon } from '@mui/icons-material';
import { useSession } from '../providers/useSession';
import { api } from '../api';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useSession();

  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/api/users/login/', formData);
      const { token } = response.data;
      await login(token); // авторизация через context
    } catch (error: any) {
      if (error.response?.status === 401) {
        setError('Неверное имя пользователя или пароль');
      } else {
        setError('Ошибка сервера. Повторите попытку позже.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper elevation={4} sx={{ p: 4, width: '100%' }}>
        <Typography variant="h5" fontWeight={600} gutterBottom align="center">
          Вход в аккаунт
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mt: 2, mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <TextField
            fullWidth
            label="Имя пользователя"
            name="username"
            value={formData.username}
            onChange={handleChange}
            margin="normal"
            required
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <UserIcon />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Пароль"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon />
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2, height: 44 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Войти'}
          </Button>
        </form>

        <Box textAlign="center" mt={2}>
          <MuiLink component={RouterLink} to="/register" variant="body2">
            Нет аккаунта? Зарегистрироваться
          </MuiLink>
        </Box>
        <Box textAlign="center" mt={1}>
          <MuiLink component={RouterLink} to="/reset-password" variant="body2">
            Забыли пароль?
          </MuiLink>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
