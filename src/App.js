// App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase-config';
import { dbService } from './database-service';
import LoginPage from './components/LoginPage';
import Layout from './components/Layout';

// Pages
import Dashboard from './Pages/Dashboard';
import BookingCalendar from './Pages/BookingCalendar';
import ResidentManagement from './Pages/ResidentManagement';
import PackageCenter from './Pages/PackageCenter';
import VisitorManagement from './Pages/VisitorManagement';
import MessageCenter from './Pages/MessageCenter';
import ComplaintsRequests from './Pages/ComplaintsRequests';
import Settings from './Pages/Settings';

import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [userCompany, setUserCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // Load user's company data
          const company = await dbService.getCompanyByEmail(currentUser.email);
          setUserCompany(company);
          
          if (!company) {
            console.warn('No company found for user email:', currentUser.email);
          }
        } catch (error) {
          console.error('Error loading user company:', error);
        }
      } else {
        setUserCompany(null);
      }
      
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

    if (!userCompany) {
      return (
        <div className="error-container">
          <div className="error-content">
            <svg viewBox="0 0 24 24" fill="none" className="error-icon">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
              <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <h2>Access Denied</h2>
            <p>Your email address is not associated with any property management company.</p>
            <p>Please contact your administrator to set up your account.</p>
            <button 
              onClick={() => auth.signOut()}
              className="logout-btn"
            >
              Sign Out
            </button>
          </div>
        </div>
      );
    }

    return children;
  };

  // Public Route component (for login page)
  const PublicRoute = ({ children }) => {
    if (!authChecked) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      );
    }

    if (user && userCompany) {
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
                <BookingCalendar />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/residents"
            element={
              <ProtectedRoute>
                <ResidentManagement />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/packages"
            element={
              <ProtectedRoute>
                <PackageCenter />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/visitors"
            element={
              <ProtectedRoute>
                <VisitorManagement />
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
                <ComplaintsRequests />
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
              user && userCompany ? 
                <Navigate to="/dashboard" replace /> : 
                <Navigate to="/login" replace />
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
                      onClick={() => window.location.href = '/dashboard'}
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