// src/App.jsx - REPLACE YOUR ENTIRE CURRENT APP.JSX WITH THIS
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Auth Components
import CitizenLogin from './components/auth/CitizenLogin';
import AdminLogin from './components/auth/AdminLogin';
import DriverLogin from './components/auth/DriverLogin';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Dashboard Components
import CitizenDashboard from './components/dashboards/CitizenDashboard';
import AdminDashboard from './components/dashboards/AdminDashboard';
import DriverDashboard from './components/dashboards/DriverDashboard';

import { USER_ROLES } from './utils/roleBasedAuth';
import './App.css';
import './styles/auth.css';
import './styles/dashboard.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Default redirect to citizen login */}
            <Route path="/" element={<Navigate to="/citizen/login" replace />} />
            
            {/* Auth Routes */}
            <Route path="/citizen/login" element={<CitizenLogin />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/driver/login" element={<DriverLogin />} />
            
            {/* Protected Dashboard Routes */}
            <Route 
              path="/citizen/dashboard" 
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.CITIZEN]}>
                  <CitizenDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/driver/dashboard" 
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.DRIVER]}>
                  <DriverDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Unauthorized Page */}
            <Route 
              path="/unauthorized" 
              element={
                <div style={{
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: '100vh',
                  flexDirection: 'column'
                }}>
                  <h1>🚫 Unauthorized Access</h1>
                  <p>You don't have permission to access this page.</p>
                  <button onClick={() => window.location.href = '/citizen/login'}>
                    Go to Login
                  </button>
                </div>
              } 
            />
            
            {/* 404 Page */}
            <Route 
              path="*" 
              element={
                <div style={{
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: '100vh',
                  flexDirection: 'column'
                }}>
                  <h1>🤔 Page Not Found</h1>
                  <p>The page you're looking for doesn't exist.</p>
                  <button onClick={() => window.location.href = '/citizen/login'}>
                    Go to Home
                  </button>
                </div>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
