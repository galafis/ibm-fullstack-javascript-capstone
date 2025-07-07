/**
 * IBM Full-Stack JavaScript Developer Capstone Project
 * Enterprise Task Management Platform - React Frontend
 * 
 * This React application demonstrates front-end development competencies
 * from the IBM Full-Stack JavaScript Developer Professional Certificate.
 * 
 * Features:
 * - Modern React with Hooks
 * - Material-UI components
 * - JWT authentication
 * - State management with Context API
 * - Responsive design
 * - Real-time updates
 * - Data visualization
 */

import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Box,
  LinearProgress,
  Alert,
  Snackbar,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Tab,
  Tabs,
  TabPanel
} from '@mui/material';

import {
  Dashboard as DashboardIcon,
  Assignment as TaskIcon,
  Folder as ProjectIcon,
  People as PeopleIcon,
  Analytics as AnalyticsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountIcon
} from '@mui/icons-material';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Authentication Context
const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// API Service
class ApiService {
  static async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  static async get(endpoint) {
    return this.request(endpoint);
  }

  static async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

// Authentication Provider
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user profile
      ApiService.get('/users/profile')
        .then(userData => setUser(userData))
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    try {
      const response = await ApiService.post('/auth/login', credentials);
      localStorage.setItem('token', response.token);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await ApiService.post('/auth/register', userData);
      localStorage.setItem('token', response.token);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Login Component
const LoginForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await login({ username: formData.username, password: formData.password });
      } else {
        await register(formData);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Card>
        <CardContent>
          <Typography variant="h4" align="center" gutterBottom>
            IBM Full-Stack Capstone
          </Typography>
          <Typography variant="h6" align="center" gutterBottom>
            {isLogin ? 'Login' : 'Register'}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              margin="normal"
              required
            />

            {!isLogin && (
              <>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  margin="normal"
                  required
                />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      margin="normal"
                      required
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      margin="normal"
                      required
                    />
                  </Grid>
                </Grid>
              </>
            )}

            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
            </Button>

            <Button
              fullWidth
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
};

// Dashboard Component
const Dashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiService.get('/analytics/dashboard')
      .then(data => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to fetch analytics:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <LinearProgress />;
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {analytics && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Tasks
                  </Typography>
                  <Typography variant="h4">
                    {analytics.summary.totalTasks}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Completed Tasks
                  </Typography>
                  <Typography variant="h4">
                    {analytics.summary.completedTasks}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Active Projects
                  </Typography>
                  <Typography variant="h4">
                    {analytics.summary.activeProjects}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Completion Rate
                  </Typography>
                  <Typography variant="h4">
                    {analytics.summary.completionRate}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Tasks by Status
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.charts.tasksByStatus}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="_id" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Tasks by Priority
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.charts.tasksByPriority}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="_id"
                      >
                        {analytics.charts.tasksByPriority.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Recent Tasks */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Tasks
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Assigned To</TableCell>
                      <TableCell>Created</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics.recentTasks.map((task) => (
                      <TableRow key={task._id}>
                        <TableCell>{task.title}</TableCell>
                        <TableCell>
                          <Chip 
                            label={task.status} 
                            size="small"
                            color={task.status === 'completed' ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={task.priority} 
                            size="small"
                            color={task.priority === 'high' ? 'error' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          {task.assignedTo ? 
                            `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 
                            'Unassigned'
                          }
                        </TableCell>
                        <TableCell>
                          {new Date(task.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}
    </Container>
  );
};

// Main App Component
const MainApp = () => {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'tasks', label: 'Tasks', icon: <TaskIcon /> },
    { id: 'projects', label: 'Projects', icon: <ProjectIcon /> },
    { id: 'team', label: 'Team', icon: <PeopleIcon /> },
    { id: 'analytics', label: 'Analytics', icon: <AnalyticsIcon /> },
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'tasks':
        return <Typography variant="h4">Tasks Management (Coming Soon)</Typography>;
      case 'projects':
        return <Typography variant="h4">Projects Management (Coming Soon)</Typography>;
      case 'team':
        return <Typography variant="h4">Team Management (Coming Soon)</Typography>;
      case 'analytics':
        return <Typography variant="h4">Advanced Analytics (Coming Soon)</Typography>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            IBM Full-Stack JavaScript Capstone
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 2 }}>
              Welcome, {user.firstName}!
            </Typography>
            <Avatar sx={{ mr: 2 }}>
              {user.firstName[0]}{user.lastName[0]}
            </Avatar>
            <Button color="inherit" onClick={logout} startIcon={<LogoutIcon />}>
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: 240, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem 
                button 
                key={item.id}
                selected={currentView === item.id}
                onClick={() => setCurrentView(item.id)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {renderContent()}
      </Box>
    </Box>
  );
};

// Main App Component
const App = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  return isAuthenticated ? <MainApp /> : <LoginForm />;
};

// Root App with Providers
const AppWithProviders = () => {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
};

export default AppWithProviders;

