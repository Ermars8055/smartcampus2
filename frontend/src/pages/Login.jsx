import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Card, TextField, Button, Typography, Alert, CircularProgress,
  InputAdornment, IconButton, MenuItem, Autocomplete, Divider
} from '@mui/material';
import { Visibility, VisibilityOff, Lock, Person, Business, Security } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [workspace, setWorkspace] = useState('');
  const [workspaces, setWorkspaces] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/auth/workspaces').then(res => setWorkspaces(res.data || [])).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!workspace) { setError('Please select a workspace'); return; }
    setLoading(true);
    try {
      await login(username, password, workspace);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 40%, #2563EB 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      <Box sx={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(96,165,250,0.15) 0%, transparent 70%)',
        top: -200, right: -100,
      }} />
      <Box sx={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%)',
        bottom: -100, left: -50,
      }} />

      <Card sx={{
        width: '100%', maxWidth: 440, p: 4,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: 4, position: 'relative', zIndex: 1,
      }}>
        {/* Header */}
        <Box sx={{
          background: 'linear-gradient(135deg, #1E3A8A, #2563EB)',
          mx: -4, mt: -4, p: 3, borderRadius: '16px 16px 0 0',
          textAlign: 'center', mb: 3,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
            <Box
              component="img"
              src="/src/assets/logo.jpg"
              alt="Eastpoint"
              sx={{
                width: 36, height: 36, objectFit: 'contain',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
              }}
            />
            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, letterSpacing: 0.5 }}>
              Eastpoint Smart Campus
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
            Materials Management Platform
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth label="Workspace ID" value={workspace}
            onChange={(e) => setWorkspace(e.target.value)} required
            placeholder="e.g. nissi-grid"
            helperText="Enter your company's workspace slug"
            InputProps={{
              startAdornment: <InputAdornment position="start"><Business color="action" /></InputAdornment>
            }}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth label="Username" value={username}
            onChange={(e) => setUsername(e.target.value)} required
            InputProps={{
              startAdornment: <InputAdornment position="start"><Person color="action" /></InputAdornment>
            }}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth label="Password" value={password}
            onChange={(e) => setPassword(e.target.value)} required
            type={showPassword ? 'text' : 'password'}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment>,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton 
                    onClick={() => setShowPassword(!showPassword)} 
                    edge="end"
                    sx={{ color: '#64748B' }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />

          <Button
            type="submit" fullWidth variant="contained" disabled={loading}
            sx={{
              py: 1.5, fontWeight: 600, fontSize: '1rem',
              background: 'linear-gradient(135deg, #1E3A8A, #2563EB)',
              '&:hover': { background: 'linear-gradient(135deg, #1E40AF, #3B82F6)' },
              boxShadow: '0 4px 15px rgba(37,99,235,0.3)',
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
          </Button>
        </form>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Divider sx={{ mb: 2 }} />
          <Button
            component={Link}
            to="/platform/login"
            startIcon={<Security sx={{ fontSize: 18 }} />}
            sx={{
              textTransform: 'none',
              color: '#64748B',
              fontWeight: 600,
              '&:hover': { color: '#1E293B', bgcolor: 'rgba(0,0,0,0.04)' }
            }}
          >
            Platform Admin Login
          </Button>
        </Box>

        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 3, color: '#94A3B8' }}>
          © 2026 Eastpoint | Powered by NissiGrid Technologies
        </Typography>
      </Card>
    </Box>
  );
}
