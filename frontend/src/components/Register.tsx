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
import {
  Person as UserIcon,
  Mail as MailIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { api } from '../api';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirm_password) {
      setError('Пароли не совпадают.');
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/auth/register/", {
			username: formData.username,
			email: formData.email,
			password: formData.password,
      password_confirm: formData.confirm_password,
		});
      navigate('/login');
    } catch (err: any){
      if (err.response?.status === 400) {
        // Check for field errors and display the first one found
        let errorMessage = 'Ошибка при регистрации. Попробуйте позже.';
        if (err.response.data) {
          const data = err.response.data;
          if (typeof data === 'string') {
            errorMessage = data;
          } else if (data.non_field_errors) {
            errorMessage = data.non_field_errors[0];
          } else if (data.username) {
            errorMessage = data.username[0];
          } else if (data.email) {
            errorMessage = data.email[0];
          } else if (data.password) {
            errorMessage = data.password[0];
          }
        }
        setError(errorMessage);
      } else if (err.response?.status === 500) {
        setError('Ошибка сервера. Попробуйте позже.');
      } else {
        setError('Произошла ошибка. Попробуйте позже.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper elevation={4} sx={{ p: 4, width: '100%' }}>
        <Typography variant="h5" fontWeight={600} gutterBottom align="center">
          Создание аккаунта
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
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MailIcon />
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

          <TextField
            fullWidth
            label="Подтвердите пароль"
            name="confirm_password"
            type="password"
            value={formData.confirm_password}
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
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Создать аккаунт'}
          </Button>
        </form>

        <Box textAlign="center" mt={2}>
          <MuiLink component={RouterLink} to="/login" variant="body2">
            Уже есть аккаунт? Войти
          </MuiLink>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;
