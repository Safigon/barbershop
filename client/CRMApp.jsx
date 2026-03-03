import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/crm/LoginPage';
import CRMLayout from './components/crm/CRMLayout';
import DashboardPage from './pages/crm/DashboardPage';
import CalendarPage from './pages/crm/CalendarPage';
import ClientsPage from './pages/crm/ClientsPage';
import ClientDetailPage from './pages/crm/ClientDetailPage';
import MastersPage from './pages/crm/MastersPage';
import ServicesPage from './pages/crm/ServicesPage';
import UsersPage from './pages/crm/UsersPage';
import MailingPage from './pages/crm/MailingPage';
import { AuthProvider, useAuth } from './components/crm/AuthContext';

function PrivateRoute({ children, adminOnly }) {
  const { user, token } = useAuth();
  if (!token) return <Navigate to="/crm/login" replace />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/crm/calendar" replace />;
  return children;
}

export default function CRMApp() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/crm/login" element={<LoginPage />} />
          <Route path="/crm" element={<PrivateRoute><CRMLayout /></PrivateRoute>}>
            <Route index element={<Navigate to="/crm/dashboard" replace />} />
            <Route path="dashboard" element={<PrivateRoute adminOnly><DashboardPage /></PrivateRoute>} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="clients" element={<PrivateRoute adminOnly><ClientsPage /></PrivateRoute>} />
            <Route path="clients/:id" element={<PrivateRoute adminOnly><ClientDetailPage /></PrivateRoute>} />
            <Route path="masters" element={<PrivateRoute adminOnly><MastersPage /></PrivateRoute>} />
            <Route path="services" element={<PrivateRoute adminOnly><ServicesPage /></PrivateRoute>} />
            <Route path="users" element={<PrivateRoute adminOnly><UsersPage /></PrivateRoute>} />
            <Route path="mailing" element={<PrivateRoute adminOnly><MailingPage /></PrivateRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/crm/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
