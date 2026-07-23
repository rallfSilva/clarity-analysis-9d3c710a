import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Analyses from "./pages/Analyses";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import DFD from "./pages/upload/DFD";
import DFDPCA from "./pages/upload/DFDPCA";
import ETP from "./pages/upload/ETP";
import NotaTecnica from "./pages/upload/NotaTecnica";
import AnaliseRisco from "./pages/upload/AnaliseRisco";
import TermoReferencia from "./pages/upload/TermoReferencia";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageUsers from "./pages/admin/ManageUsers";
import AuditLogs from "./pages/admin/AuditLogs";
import ManagePrompts from "./pages/admin/ManagePrompts";
import AllAnalyses from "./pages/admin/AllAnalyses";
import NotFound from "./pages/NotFound";
import { Navigate } from "react-router-dom";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* User Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
            <Route path="/upload" element={<Navigate to="/upload/dfd" replace />} />
            <Route path="/upload/dfd" element={<ProtectedRoute><DashboardLayout><DFD /></DashboardLayout></ProtectedRoute>} />
            <Route path="/upload/dfd-pca" element={<ProtectedRoute><DashboardLayout><DFDPCA /></DashboardLayout></ProtectedRoute>} />
            <Route path="/upload/etp" element={<ProtectedRoute><DashboardLayout><ETP /></DashboardLayout></ProtectedRoute>} />
            <Route path="/upload/nota-tecnica" element={<ProtectedRoute><DashboardLayout><NotaTecnica /></DashboardLayout></ProtectedRoute>} />
            <Route path="/upload/analise-risco" element={<ProtectedRoute><DashboardLayout><AnaliseRisco /></DashboardLayout></ProtectedRoute>} />
            <Route path="/upload/termo-referencia" element={<ProtectedRoute><DashboardLayout><TermoReferencia /></DashboardLayout></ProtectedRoute>} />
            <Route path="/analyses" element={<ProtectedRoute><DashboardLayout><Analyses /></DashboardLayout></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><DashboardLayout><Reports /></DashboardLayout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><DashboardLayout><Settings /></DashboardLayout></ProtectedRoute>} />
            
            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<ProtectedRoute requireAdmin><DashboardLayout><AdminDashboard /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requireAdmin><DashboardLayout><ManageUsers /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/audit" element={<ProtectedRoute requireAdmin><DashboardLayout><AuditLogs /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/prompts" element={<ProtectedRoute requireAdmin><DashboardLayout><ManagePrompts /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/analyses" element={<ProtectedRoute requireAdmin><DashboardLayout><AllAnalyses /></DashboardLayout></ProtectedRoute>} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
