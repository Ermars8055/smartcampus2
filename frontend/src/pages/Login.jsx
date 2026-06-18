import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Card, TextField, Button, Typography, Alert, CircularProgress,
  InputAdornment, IconButton, MenuItem, Autocomplete, Divider
} from '@mui/material';
import { Visibility, VisibilityOff, Lock, Person, Business, Security, VpnKey } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import logoImg from '../assets/logo.png';

export default function Login() {
  const [view, setView] = useState('login'); // login | forgot_password | verify_otp | reset_password
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [workspace, setWorkspace] = useState('');
  const [workspaces, setWorkspaces] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    api.get('/api/auth/workspaces').then(res => setWorkspaces(res.data || [])).catch(() => { });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccessMsg('');
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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError(''); setSuccessMsg('');
    if (!workspace || !username) { setError('Please enter Workspace ID and Username'); return; }
    setLoading(true);
    try {
      const res = await api.post('/api/auth/forgot-password', { username, workspace });
      setSuccessMsg(res.data.message);
      setView('verify_otp');
      setResendTimer(180);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError(''); setSuccessMsg('');
    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { username, workspace });
      setSuccessMsg("OTP resent successfully.");
      setResendTimer(180);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError(''); setSuccessMsg('');
    if (!otp) { setError('Please enter OTP'); return; }
    setLoading(true);
    try {
      await api.post('/api/auth/verify-otp', { username, workspace, otp });
      setSuccessMsg('OTP verified successfully. Please enter your new password.');
      setView('reset_password');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(''); setSuccessMsg('');
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const res = await api.post('/api/auth/reset-password', { username, workspace, otp, new_password: newPassword });
      setSuccessMsg(res.data.message);
      setView('login');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const resetView = () => {
    setView('login');
    setError('');
    setSuccessMsg('');
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
              src={logoImg}
              alt="Eastpoint"
              sx={{
                width: 36, height: 36, objectFit: 'contain',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
              }}
            />
            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, letterSpacing: 0.5 }}>
              Eastpoint SmartCampus
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
            Material Governance Platform
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}

        {view === 'login' && (
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth label="Workspace ID" value={workspace}
              onChange={(e) => setWorkspace(e.target.value)} required
              placeholder=""
              helperText=""
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
              sx={{ mb: 1 }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                onClick={() => { setView('forgot_password'); setError(''); setSuccessMsg(''); }}
                sx={{ textTransform: 'none', color: '#2563EB', fontWeight: 600, p: 0, '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}
              >
                Forgot Password?
              </Button>
            </Box>

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
        )}

        {view === 'forgot_password' && (
          <form onSubmit={handleForgotPassword}>
            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary', textAlign: 'center' }}>
              Enter your Workspace ID and Username. We will send an OTP to your registered email address.
            </Typography>
            <TextField
              fullWidth label="Workspace ID" value={workspace}
              onChange={(e) => setWorkspace(e.target.value)} required
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
              sx={{ mb: 3 }}
            />
            <Button
              type="submit" fullWidth variant="contained" disabled={loading}
              sx={{ py: 1.5, fontWeight: 600, fontSize: '1rem', background: 'linear-gradient(135deg, #1E3A8A, #2563EB)' }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Send OTP'}
            </Button>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button onClick={resetView} sx={{ textTransform: 'none', color: 'text.secondary' }}>Back to Login</Button>
            </Box>
          </form>
        )}

        {view === 'verify_otp' && (
          <form onSubmit={handleVerifyOTP}>
            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary', textAlign: 'center' }}>
              Enter the 6-digit OTP sent to your registered email address.
            </Typography>
            <TextField
              fullWidth label="6-Digit OTP" value={otp}
              onChange={(e) => setOtp(e.target.value)} required
              inputProps={{ maxLength: 6 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><VpnKey color="action" /></InputAdornment>
              }}
              sx={{ mb: 3, textAlign: 'center' }}
            />
            <Button
              type="submit" fullWidth variant="contained" disabled={loading}
              sx={{ py: 1.5, fontWeight: 600, fontSize: '1rem', background: 'linear-gradient(135deg, #1E3A8A, #2563EB)' }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify OTP'}
            </Button>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button onClick={() => setView('forgot_password')} sx={{ textTransform: 'none', color: 'text.secondary' }}>Back</Button>
              {resendTimer > 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Resend in {Math.floor(resendTimer / 60)}:{(resendTimer % 60).toString().padStart(2, '0')}
                </Typography>
              ) : (
                <Button onClick={handleResendOTP} disabled={loading} sx={{ textTransform: 'none', fontWeight: 600 }}>
                  Resend OTP
                </Button>
              )}
            </Box>
          </form>
        )}

        {view === 'reset_password' && (
          <form onSubmit={handleResetPassword}>
            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary', textAlign: 'center' }}>
              Enter your new password below.
            </Typography>
            <TextField
              fullWidth label="New Password" value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)} required
              type={showNewPassword ? 'text' : 'password'}
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
              InputProps={{
                startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment>
              }}
              sx={{ mb: 3 }}
            />
            <Button
              type="submit" fullWidth variant="contained" disabled={loading}
              sx={{ py: 1.5, fontWeight: 600, fontSize: '1rem', background: 'linear-gradient(135deg, #1E3A8A, #2563EB)' }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
            </Button>
          </form>
        )}

        {view === 'login' && (
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
        )}

        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 3, color: '#94A3B8' }}>
          © 2026 Eastpoint | Powered by NissiGrid Technologies
        </Typography>
      </Card>
    </Box>
  );
}
