import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import MastersPage from './pages/MastersPage';
import PricePage from './pages/PricePage';
import ContactsPage from './pages/ContactsPage';
import BookingPage from './pages/BookingPage';

// CRM
import { AuthProvider } from './components/crm/AuthContext';
import CRMLayout from './components/crm/CRMLayout';
import LoginPage from './pages/crm/LoginPage';
import DashboardPage from './pages/crm/DashboardPage';
import CalendarPage from './pages/crm/CalendarPage';
import ClientsPage from './pages/crm/ClientsPage';
import ClientDetailPage from './pages/crm/ClientDetailPage';
import MastersPageCRM from './pages/crm/MastersPage';
import ServicesPage from './pages/crm/ServicesPage';
import UsersPage from './pages/crm/UsersPage';
import MailingPage from './pages/crm/MailingPage';
import { Navigate } from 'react-router-dom';
import { useAuth } from './components/crm/AuthContext';

function PrivateRoute({ children, adminOnly }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/crm/login" replace />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/crm/calendar" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Публичный сайт */}
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="masters" element={<MastersPage />} />
            <Route path="price" element={<PricePage />} />
            <Route path="contacts" element={<ContactsPage />} />
            <Route path="booking" element={<BookingPage />} />
          </Route>

          {/* CRM */}
          <Route path="/crm/login" element={<LoginPage />} />
          <Route path="/crm" element={<PrivateRoute><CRMLayout /></PrivateRoute>}>
            <Route index element={<Navigate to="/crm/dashboard" replace />} />
            <Route path="dashboard" element={<PrivateRoute adminOnly><DashboardPage /></PrivateRoute>} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="clients" element={<PrivateRoute adminOnly><ClientsPage /></PrivateRoute>} />
            <Route path="clients/:id" element={<PrivateRoute adminOnly><ClientDetailPage /></PrivateRoute>} />
            <Route path="masters" element={<PrivateRoute adminOnly><MastersPageCRM /></PrivateRoute>} />
            <Route path="services" element={<PrivateRoute adminOnly><ServicesPage /></PrivateRoute>} />
            <Route path="users" element={<PrivateRoute adminOnly><UsersPage /></PrivateRoute>} />
            <Route path="mailing" element={<PrivateRoute adminOnly><MailingPage /></PrivateRoute>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;