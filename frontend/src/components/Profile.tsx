import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { api } from '../api';

interface UserData {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
}

const Profile = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await api.get('/api/users/me/');
      setUserData(response.data);
    } catch {
      setError('Не удалось загрузить профиль.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.new_password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов.');
      return;
    }

    if (formData.new_password !== formData.confirm_password) {
      setError('Пароли не совпадают.');
      return;
    }

    try {
      setSaving(true);
      await api.post('/api/users/change-password/', formData);
      setSuccess('Пароль успешно изменён.');
      setFormData({ current_password: '', new_password: '', confirm_password: '' });
    } catch {
      setError('Не удалось изменить пароль.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Профиль
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Информация об аккаунте
        </Typography>
        <Grid container spacing={2}>
          <Grid size={12}>
            <Typography variant="body2" color="text.secondary">
              Имя пользователя
            </Typography>
            <Typography>{userData?.username}</Typography>
          </Grid>
          <Grid size={12}>
            <Typography variant="body2" color="text.secondary">
              Email
            </Typography>
            <Typography>{userData?.email}</Typography>
          </Grid>
          <Grid size={12}>
            <Typography variant="body2" color="text.secondary">
              Роль
            </Typography>
            <Typography>{userData?.is_staff ? 'Администратор' : 'Пользователь'}</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Смена пароля
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid size={12}>
              <TextField
                label="Текущий пароль"
                name="current_password"
                type="password"
                fullWidth
                required
                value={formData.current_password}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Новый пароль"
                name="new_password"
                type="password"
                fullWidth
                required
                value={formData.new_password}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Подтвердите пароль"
                name="confirm_password"
                type="password"
                fullWidth
                required
                value={formData.confirm_password}
                onChange={handleChange}
              />
            </Grid>
            <Grid  size={12}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={saving}
                sx={{ height: 44 }}
              >
                {saving ? 'Сохранение...' : 'Изменить пароль'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default Profile;
