// App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase-config';
import LoginPage from './components/LoginPage';

// Pages
import Dashboard from './Pages/Dashboard';
import ServiceBookingCalendar from './Pages/ServiceBookingCalendar';
import GuestManagement from './Pages/GuestManagement';
import ParcelManagement from './Pages/ParcelManagement';
import GuestVisitorManagement from './Pages/GuestVisitorManagement';
import MessageCenter from './Pages/MessageCenter';
import GuestRequestsIssues from './Pages/GuestRequestsIssues';
import Settings from './Pages/Settings';

import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, []);

  // Protected Route component
  const ProtectedRoute = ({ children }) => {
    if (!authChecked) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Checking authentication...</p>
        </div>
      );
    }

    if (!user) {
      return <Navigate to="/login" replace />;
    }

    return children;
  };

  // Public Route component
  const PublicRoute = ({ children }) => {
    if (!authChecked) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      );
    }

    if (user) {
      return <Navigate to="/dashboard" replace />;
    }

    return children;
  };

  if (loading || !authChecked) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <ServiceBookingCalendar />
              </ProtectedRoute>
            }
          />

          <Route
            path="/guests"
            element={
              <ProtectedRoute>
                <GuestManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/packages"
            element={
              <ProtectedRoute>
                <ParcelManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/visitors"
            element={
              <ProtectedRoute>
                <GuestVisitorManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <MessageCenter />
              </ProtectedRoute>
            }
          />

          <Route
            path="/complaints"
            element={
              <ProtectedRoute>
                <GuestRequestsIssues />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Default redirects */}
          <Route
            path="/"
            element={
              user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
            }
          />

          {/* 404 Route */}
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <div className="not-found-container">
                  <div className="not-found-content">
                    <h1>404</h1>
                    <h2>Page Not Found</h2>
                    <p>The page you're looking for doesn't exist.</p>
                    <button
                      onClick={() => (window.location.href = '/dashboard')}
                      className="back-home-btn"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
