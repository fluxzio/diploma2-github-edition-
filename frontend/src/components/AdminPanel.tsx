import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Button,
  Alert,
} from '@mui/material';
import { api } from '../api';

interface User {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  date_joined: string;
}

interface File {
  id: number;
  name: string;
  owner: string;
  size: number;
  upload_date: string;
  is_public: boolean;
}

const AdminPanel = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);

  useEffect(() => {
    fetchUsers();
    fetchFiles();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/users/');
      setUsers(res.data);
    } catch {
      setError('Ошибка при загрузке пользователей.');
    }
  };

  const fetchFiles = async () => {
    try {
      const res = await api.get('/api/files/');
      setFiles(res.data);
    } catch {
      setError('Ошибка при загрузке файлов.');
    }
  };

  const handleToggleStaff = async (userId: number, isStaff: boolean) => {
    try {
      await api.patch(`/api/users/${userId}/`, { is_staff: !isStaff });
      fetchUsers();
    } catch {
      setError('Не удалось изменить роль пользователя.');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Удалить пользователя?')) return;
    try {
      await api.delete(`/api/users/${userId}/`);
      fetchUsers();
    } catch {
      setError('Не удалось удалить пользователя.');
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!window.confirm('Удалить файл?')) return;
    try {
      await api.delete(`/api/files/${fileId}/`);
      fetchFiles();
    } catch {
      setError('Не удалось удалить файл.');
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleString();
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const sizes = ['B', 'KB', 'MB', 'GB'];
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Панель администратора
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Пользователи" />
        <Tab label="Файлы" />
      </Tabs>

      {tab === 0 && (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Имя</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Роль</TableCell>
                <TableCell>Дата регистрации</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.is_staff ? 'Admin' : 'User'}</TableCell>
                  <TableCell>{formatDate(user.date_joined)}</TableCell>
                  <TableCell align="right">
                    <Button
                      variant="outlined"
                      size="small"
                      color={user.is_staff ? 'secondary' : 'primary'}
                      onClick={() => handleToggleStaff(user.id, user.is_staff)}
                      sx={{ mr: 1 }}
                    >
                      {user.is_staff ? 'Сделать User' : 'Сделать Admin'}
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      Удалить
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Нет пользователей
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      {tab === 1 && (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Название</TableCell>
                <TableCell>Владелец</TableCell>
                <TableCell>Размер</TableCell>
                <TableCell>Дата загрузки</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>{file.name}</TableCell>
                  <TableCell>{file.owner}</TableCell>
                  <TableCell>{formatSize(file.size)}</TableCell>
                  <TableCell>{formatDate(file.upload_date)}</TableCell>
                  <TableCell>{file.is_public ? 'Публичный' : 'Приватный'}</TableCell>
                  <TableCell align="right">
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      onClick={() => handleDeleteFile(file.id)}
                    >
                      Удалить
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {files.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Нет файлов
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Container>
  );
};

export default AdminPanel;
