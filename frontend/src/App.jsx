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
import { ConfigProvider } from './context/ConfigContext';
import { MessageProvider } from './context/MessageContext';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Materials from './pages/Materials';
import Categories from './pages/Categories';
import SubCategories from './pages/SubCategories';
import UOM from './pages/UOM';
import Vendors from './pages/Vendors';
import Projects from './pages/Projects';
import Departments from './pages/Departments';
import Warehouses from './pages/Warehouses';
import Indents from './pages/Indents';
import PurchaseRequests from './pages/PurchaseRequests';
import Quotations from './pages/Quotations';
import PurchaseOrders from './pages/PurchaseOrders';
import GateEntry from './pages/GateEntry';
import Invoices from './pages/Invoices';
import InvoiceTracking from './pages/InvoiceTracking';
import RegisterInvoice from './pages/RegisterInvoice';
import GRNPage from './pages/GRN';
import MaterialIssue from './pages/MaterialIssue';
import Returns from './pages/Returns';
import StockTransfers from './pages/StockTransfers';
import GatePasses from './pages/GatePasses';
import PendingAcknowledgments from './pages/PendingAcknowledgments';
import Inventory from './pages/Inventory';
import Intelligence from './pages/Intelligence';
import Reports from './pages/Reports';
import IssueSummaryReport from './pages/IssueSummaryReport';
import RateAnalysisReport from './pages/RateAnalysisReport';
import ReceiptSummaryReport from './pages/ReceiptSummaryReport';
import DepartmentWiseInventoryReport from './pages/DepartmentWiseInventoryReport';
import Users from './pages/Users';
import AuditLogs from './pages/AuditLogs';
import ApprovalFlows from './pages/ApprovalFlows';
import RolesList from './pages/RolesList';
import MaterialAllowances from './pages/MaterialAllowances';
import Configurations from './pages/Configurations';
import RoleConfiguration from './pages/RoleConfiguration';
import SaasAdmin from './pages/SaasAdmin';
import Alerts from './pages/Alerts';
import PlatformLogin from './pages/PlatformLogin';
import TermsAndConditions from './pages/TermsAndConditions';
import CompanyAddresses from './pages/CompanyAddresses';
import ComplaintsList from './pages/ComplaintsList';
import ComplaintForm from './pages/ComplaintForm';
import ComplaintDetail from './pages/ComplaintDetail';
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
        <Route path="subcategories" element={<SubCategories />} />
        <Route path="uom" element={<UOM />} />
        <Route path="vendors" element={<Vendors />} />
        <Route path="projects" element={<Projects />} />
        <Route path="departments" element={<Departments />} />
        <Route path="warehouses" element={<Warehouses />} />
        <Route path="indents" element={<Indents />} />
        <Route path="purchase-requests" element={<PurchaseRequests />} />
        <Route path="quotations" element={<Quotations />} />
        <Route path="purchase-orders" element={<PurchaseOrders />} />
        <Route path="gate-entry" element={<GateEntry />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="invoice-tracking" element={<InvoiceTracking />} />
        <Route path="invoices/register" element={<RegisterInvoice />} />
        <Route path="invoices/edit/:id" element={<RegisterInvoice />} />
        <Route path="grn" element={<GRNPage />} />
        <Route path="issues" element={<MaterialIssue />} />
        <Route path="pending-acknowledgments" element={<PendingAcknowledgments />} />
        <Route path="returns" element={<Returns />} />
        <Route path="transfers" element={<StockTransfers />} />
        <Route path="gate-passes" element={<GatePasses />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="intelligence" element={<Intelligence />} />
        <Route path="reports" element={<Reports />} />
        <Route path="reports/issue-summary" element={<IssueSummaryReport />} />
        <Route path="reports/rate-analysis" element={<RateAnalysisReport />} />
        <Route path="reports/receipt-summary" element={<ReceiptSummaryReport />} />
        <Route path="reports/department-inventory" element={<DepartmentWiseInventoryReport />} />
        <Route path="admin" element={<Navigate to="/admin/configurations" replace />} />
        <Route path="admin/users" element={<Users />} />
        <Route path="admin/audit-logs" element={<AuditLogs />} />
        <Route path="admin/approval-flows" element={<ApprovalFlows />} />
        <Route path="admin/roles" element={<RolesList />} />
        <Route path="admin/material-allowances" element={<MaterialAllowances />} />
        <Route path="admin/configurations" element={<Configurations />} />
        <Route path="admin/roles/new" element={<RoleConfiguration />} />
        <Route path="admin/roles/:id" element={<RoleConfiguration />} />
        <Route path="terms" element={<TermsAndConditions />} />
        <Route path="company-addresses" element={<CompanyAddresses />} />
        <Route path="saas-admin" element={<SaasAdmin />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="complaints" element={<ComplaintsList />} />
        <Route path="complaints/new" element={<ComplaintForm />} />
        <Route path="complaints/:id" element={<ComplaintDetail />} />
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
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <ConfigProvider>
              <MessageProvider>
                <AppRoutes />
                <ChatBot />
              </MessageProvider>
            </ConfigProvider>
          </LocalizationProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
