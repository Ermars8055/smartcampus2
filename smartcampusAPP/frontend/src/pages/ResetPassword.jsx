import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Card, TextField, Button, Typography, Alert, CircularProgress, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff, Lock, Security } from '@mui/icons-material';
import api from '../services/api';
import logoImg from '../assets/logo.png';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const email = searchParams.get('email');
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!email || !token) {
      setError('Invalid or missing password reset link.');
    }
  }, [email, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email || !token) {
      setError('Invalid reset link.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/api/auth/reset-password', {
        email,
        token,
        new_password: newPassword
      });
      setSuccessMsg(res.data.message);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
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
        width: '100%', maxWidth: 440, p: 4, background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)', boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4, position: 'relative', zIndex: 1,
      }}>
        {/* Header */}
        <Box sx={{
          background: 'linear-gradient(135deg, #1E3A8A, #2563EB)',
          mx: -4, mt: -4, p: 3, borderRadius: '16px 16px 0 0',
          textAlign: 'center', mb: 3,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
            <Box component="img" src={logoImg} alt="Eastpoint" sx={{ width: 36, height: 36, objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, letterSpacing: 0.5 }}>
              Eastpoint SmartCampus
            </Typography>
          </Box>
        </Box>

        <Typography variant="h6" sx={{ mb: 2, textAlign: 'center', fontWeight: 600 }}>Reset Password</Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg} Redirecting to login...</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth label="New Password" value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)} required
            type={showNewPassword ? 'text' : 'password'}
            disabled={loading || !!successMsg || (!email || !token)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment>,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth label="Confirm Password" value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)} required
            type={showNewPassword ? 'text' : 'password'}
            disabled={loading || !!successMsg || (!email || !token)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment>
            }}
            sx={{ mb: 3 }}
          />
          <Button
            type="submit" fullWidth variant="contained" disabled={loading || !!successMsg || (!email || !token)}
            sx={{ py: 1.5, fontWeight: 600, fontSize: '1rem', background: 'linear-gradient(135deg, #1E3A8A, #2563EB)' }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
          </Button>
        </form>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button onClick={() => navigate('/login')} sx={{ textTransform: 'none', color: 'text.secondary' }}>Back to Login</Button>
        </Box>
      </Card>
    </Box>
  );
}
