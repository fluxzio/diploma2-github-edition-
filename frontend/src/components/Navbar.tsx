import {
  Drawer,
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Home,
  FileText,
  User,
  Shield,
  LogOut,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '../providers/useSession';

const drawerWidth = 240;

const Navbar = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useSession();
  const isAdmin = user?.is_staff;

  const menuItems = isAuthenticated
    ? [
        { label: 'Dashboard', path: '/dashboard', icon: <Home /> },
        { label: 'Files', path: '/files', icon: <FileText /> },
        { label: 'Profile', path: '/profile', icon: <User /> },
        ...(isAdmin ? [{ label: 'Admin', path: '/admin', icon: <Shield /> }] : []),
      ]
    : [
        { label: 'Login', path: '/login', icon: <LogIn /> },
        { label: 'Register', path: '/register', icon: <UserPlus /> },
      ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: theme.palette.background.paper,
          borderRight: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      <Toolbar>
        <Typography variant="h6" noWrap color="primary" fontWeight="bold">
          SecureShare
        </Typography>
      </Toolbar>
      <Divider />

      <Box sx={{ flexGrow: 1 }}>
        <List>
          {menuItems.map(({ label, path, icon }) => (
            <ListItemButton
              key={path}
              selected={isActive(path)}
              onClick={() => navigate(path)}
            >
              <ListItemIcon>{icon}</ListItemIcon>
              <ListItemText primary={label} />
            </ListItemButton>
          ))}
        </List>
      </Box>

      {isAuthenticated && (
        <>
          <Divider />
          <List>
            <ListItemButton onClick={logout}>
              <ListItemIcon>
                <LogOut />
              </ListItemIcon>
              <ListItemText primary="Logout" primaryTypographyProps={{ color: 'error' }} />
            </ListItemButton>
          </List>
        </>
      )}
    </Drawer>
  );
};

export default Navbar;
