import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Card, TextField, Button, Typography, Alert, CircularProgress,
  InputAdornment, IconButton, Paper
} from '@mui/material';
import { Visibility, VisibilityOff, Lock, Person, Security, ArrowBack } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export default function PlatformLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Platform login: no workspace ID
      await login(username, password, null);
      navigate('/saas-admin');
    } catch (err) {
      setError(err.response?.data?.detail || 'Platform access denied. Authorized personnel only.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#F8FAFC',
      backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
      backgroundSize: '32px 32px',
    }}>
      <Card sx={{
        width: '100%', maxWidth: 460,
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        borderRadius: 3, overflow: 'hidden'
      }}>
        {/* Dark Header */}
        <Box sx={{
          background: '#1E293B', color: '#fff', p: 3,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5
        }}>
          <Security sx={{ color: '#94A3B8' }} />
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 1 }}>
            Platform Administration
          </Typography>
        </Box>

        <Box sx={{ p: 4 }}>
          <Paper sx={{ p: 2, mb: 3, bgcolor: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 2 }}>
            <Typography variant="caption" sx={{ color: '#92400E', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              ⚠️ Authorized Personnel Only. This area is for managing SaaS tenants.
            </Typography>
          </Paper>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: '#475569', fontWeight: 600 }}>Admin Username / Email</Typography>
            <TextField
              fullWidth value={username}
              onChange={(e) => setUsername(e.target.value)} required
              placeholder="e.g. admin"
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><Person fontSize="small" color="action" /></InputAdornment>
                }
              }}
              sx={{ mb: 3 }}
            />

            <Typography variant="subtitle2" sx={{ mb: 1, color: '#475569', fontWeight: 600 }}>Password</Typography>
            <TextField
              fullWidth value={password}
              onChange={(e) => setPassword(e.target.value)} required
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton 
                        onClick={() => setShowPassword(!showPassword)} 
                        edge="end"
                        size="small"
                        sx={{ color: '#64748B' }}
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }
              }}
              sx={{ mb: 4 }}
            />

            <Button
              type="submit" fullWidth variant="contained" disabled={loading}
              sx={{
                py: 1.5, fontWeight: 700,
                backgroundColor: '#1E293B',
                '&:hover': { backgroundColor: '#0F172A' },
                boxShadow: '0 10px 15px -3px rgba(30, 41, 59, 0.2)',
                textTransform: 'none', mb: 2
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Access Platform'}
            </Button>
          </form>

          <Button
            component={Link} to="/login"
            startIcon={<ArrowBack />}
            fullWidth
            sx={{ textTransform: 'none', color: '#64748B', fontWeight: 600 }}
          >
            Back to Workspace Login
          </Button>
        </Box>
      </Card>
    </Box>
  );
}
