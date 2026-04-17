import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, TextField, Button, Typography, Alert, CircularProgress,
  InputAdornment, IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, Lock, Person } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export default function Login() {
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
      await login(username, password);
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
      {/* Background decorations */}
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
        width: '100%', maxWidth: 420, p: 4,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: 4,
        position: 'relative', zIndex: 1,
      }}>
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            component="img"
            src={'/src/assets/logo.jpg'}
            alt="NissiGrid Logo"
            sx={{
              width: 80, height: 80, objectFit: 'contain', mx: 'auto', mb: 2,
              filter: 'drop-shadow(0 8px 16px rgba(30, 58, 138, 0.2))'
            }}
          />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E3A8A', mb: 0.5 }}>
            NissiGrid Smart Stores
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            Enterprise Materials Governance Platform
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth label="Username" value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Person sx={{ color: '#94A3B8' }} /></InputAdornment>,
            }}
            required autoFocus
          />
          <TextField
            fullWidth label="Password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            type={showPassword ? 'text' : 'password'}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Lock sx={{ color: '#94A3B8' }} /></InputAdornment>,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} size="small">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            required
          />
          <Button
            type="submit" fullWidth variant="contained" size="large"
            disabled={loading}
            sx={{
              py: 1.4, fontSize: '1rem', fontWeight: 600,
              background: 'linear-gradient(90deg, #1E3A8A, #2563EB)',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              '&:hover': { background: 'linear-gradient(90deg, #1e2a6a, #1d4ed8)', boxShadow: '0 6px 20px rgba(37, 99, 235, 0.5)' },
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Sign In'}
          </Button>
        </form>

        <Box sx={{ mt: 3, p: 2, background: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>
            Demo Credentials
          </Typography>
          <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
            Admin: <b>admin</b> / <b>admin123</b>
          </Typography>
          <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
            Store Keeper: <b>storekeeper</b> / <b>pass123</b>
          </Typography>
        </Box>

        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 2, color: '#94A3B8' }}>
          © 2026 NissiGrid Technologies
        </Typography>
      </Card>
    </Box>
  );
}
