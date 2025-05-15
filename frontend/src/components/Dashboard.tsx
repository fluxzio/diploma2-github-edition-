import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress,
  Grid,
  Alert,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { api } from '../api';

interface DashboardStats {
  total_files: number;
  total_shared: number;
  total_downloads: number;
  recent_activities: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    total_files: 0,
    total_shared: 0,
    total_downloads: 0,
    recent_activities: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/dashboard/stats/');
      setStats(response.data);
    } catch {
      setError('Не удалось загрузить статистику. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'upload':
        return (
          <Avatar sx={{ bgcolor: 'primary.light', width: 40, height: 40 }}>
            <UploadIcon color="primary" />
          </Avatar>
        );
      case 'download':
        return (
          <Avatar sx={{ bgcolor: 'success.light', width: 40, height: 40 }}>
            <DownloadIcon color="success" />
          </Avatar>
        );
      case 'share':
        return (
          <Avatar sx={{ bgcolor: 'secondary.light', width: 40, height: 40 }}>
            <ShareIcon color="secondary" />
          </Avatar>
        );
      default:
        return (
          <Avatar sx={{ bgcolor: 'grey.300', width: 40, height: 40 }}>?</Avatar>
        );
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Панель управления
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Всего файлов
            </Typography>
            <Typography variant="h4">{stats.total_files}</Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Общих файлов
            </Typography>
            <Typography variant="h4">{stats.total_shared}</Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Скачиваний
            </Typography>
            <Typography variant="h4">{stats.total_downloads}</Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Последние действия
            </Typography>
            {stats.recent_activities.length > 0 ? (
              <List>
                {stats.recent_activities.map((activity, index) => (
                  <ListItem key={index}>
                    <ListItemAvatar>{getActivityIcon(activity.type)}</ListItemAvatar>
                    <ListItemText
                      primary={activity.description}
                      secondary={new Date(activity.timestamp).toLocaleString()}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                Нет последних действий
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
