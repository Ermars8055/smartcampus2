import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Typography, Button } from '@mui/material';
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import theme from './theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MessageProvider } from './context/MessageContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Materials from './pages/Materials';
import Categories from './pages/Categories';
import Vendors from './pages/Vendors';
import Projects from './pages/Projects';
import Indents from './pages/Indents';
import PurchaseRequests from './pages/PurchaseRequests';
import Quotations from './pages/Quotations';
import PurchaseOrders from './pages/PurchaseOrders';
import GateEntry from './pages/GateEntry';
import GRNPage from './pages/GRN';
import StoreOps from './pages/StoreOps';
import Inventory from './pages/Inventory';
import Intelligence from './pages/Intelligence';
import Reports from './pages/Reports';
import Admin from './pages/Admin';
import SaasAdmin from './pages/SaasAdmin';
import Alerts from './pages/Alerts';
import PlatformLogin from './pages/PlatformLogin';
import ChatBot from './components/ChatBot';
import { Box, CircularProgress } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>Something went wrong.</Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>{this.state.error?.toString()}</Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>Reload Page</Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  return user ? <ErrorBoundary>{children}</ErrorBoundary> : <Navigate to="/login" />;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/platform/login" element={user ? <Navigate to="/saas-admin" /> : <PlatformLogin />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="materials" element={<Materials />} />
        <Route path="categories" element={<Categories />} />
        <Route path="vendors" element={<Vendors />} />
        <Route path="projects" element={<Projects />} />
        <Route path="warehouses" element={<Projects />} />
        <Route path="indents" element={<Indents />} />
        <Route path="purchase-requests" element={<PurchaseRequests />} />
        <Route path="quotations" element={<Quotations />} />
        <Route path="purchase-orders" element={<PurchaseOrders />} />
        <Route path="gate-entry" element={<GateEntry />} />
        <Route path="grn" element={<GRNPage />} />
        <Route path="issues" element={<StoreOps />} />
        <Route path="returns" element={<StoreOps />} />
        <Route path="transfers" element={<StoreOps />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="intelligence" element={<Intelligence />} />
        <Route path="reports" element={<Reports />} />
        <Route path="admin" element={<Admin />} />
        <Route path="saas-admin" element={<SaasAdmin />} />
        <Route path="alerts" element={<Alerts />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <MessageProvider>
            <AppRoutes />
            <ChatBot />
          </MessageProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
