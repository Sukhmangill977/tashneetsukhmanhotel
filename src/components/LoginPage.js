// components/LoginPage.js
import React, { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase-config';
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // User will be automatically redirected via the onAuthStateChanged listener in App.js
    } catch (error) {
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
      setShowForgotPassword(false);
    } catch (error) {
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address';
      case 'auth/invalid-credential':
        return 'Incorrect email or password';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/user-disabled':
        return 'This account has been disabled';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      case 'auth/invalid-credential':
        return 'Invalid email or password';
      default:
        return 'An error occurred. Please try again';
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="floating-orb orb-1"></div>
        <div className="floating-orb orb-2"></div>
        <div className="floating-orb orb-3"></div>
      </div>
      
      <div className="login-content">
        <div className="login-card">
          <div className="login-header">
            <div className="brand-section">
              <div className="login-logo-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="login-brand-text">
                <h1 className="login-brand-title">Claro AI</h1>
                <p className="login-brand-subtitle">Hotel Management CRM</p>
              </div>
              <p className="login-welcome-text">AI-Powered Concierge Dashboard</p>
            </div>
          </div>

          <div className="login-form-section">
            {resetEmailSent && (
              <div className="login-alert login-alert-success">
                <div className="login-alert-icon">✓</div>
                <div>
                  <strong>Email sent!</strong>
                  <p>Check your inbox for password reset instructions.</p>
                </div>
              </div>
            )}

            {error && (
              <div className="login-alert login-alert-error">
                <div className="login-alert-icon">⚠</div>
                <div>
                  <strong>Authentication Error</strong>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {!showForgotPassword ? (
              <form onSubmit={handleLogin} className="login-form">
                <div className="login-form-grid">
                  <div className="login-input-group">
                    <label htmlFor="email" className="login-input-label">Email Address</label>
                    <div className="login-input-wrapper">
                      <svg className="login-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/>
                        <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your work email"
                        className="login-input"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="login-input-group">
                    <label htmlFor="password" className="login-input-label">Password</label>
                    <div className="login-input-wrapper">
                      <svg className="login-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="12" cy="16" r="1" fill="currentColor"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="login-input"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <div className="login-form-actions">
                  <button 
                    type="submit" 
                    className="login-button login-button-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="login-loading-spinner"></div>
                        Authenticating...
                      </>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="2"/>
                          <polyline points="10,17 15,12 10,7" stroke="currentColor" strokeWidth="2"/>
                          <line x1="15" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        Access Dashboard
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="login-forgot-link"
                    onClick={() => setShowForgotPassword(true)}
                    disabled={loading}
                  >
                    Forgot your password?
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleForgotPassword} className="login-form">
                <div className="login-reset-header">
                  <h3>Reset Password</h3>
                  <p>Enter your email address and we'll send you instructions to reset your password.</p>
                </div>

                <div className="login-input-group">
                  <label htmlFor="reset-email" className="login-input-label">Email Address</label>
                  <div className="login-input-wrapper">
                    <svg className="login-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/>
                      <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <input
                      type="email"
                      id="reset-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your work email"
                      className="login-input"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="login-form-actions">
                  <button 
                    type="submit" 
                    className="login-button login-button-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="login-loading-spinner"></div>
                        Sending...
                      </>
                    ) : (
                      'Send Reset Instructions'
                    )}
                  </button>

                  <button
                    type="button"
                    className="login-forgot-link"
                    onClick={() => setShowForgotPassword(false)}
                    disabled={loading}
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="login-footer">
          <div className="login-security-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span>Enterprise-grade security</span>
          </div>
          <p>© 2025 Claro AI. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;