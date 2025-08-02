// components/Layout.js
import React, { useState, useEffect } from 'react';
import { auth } from '../firebase-config';
import { dbService } from '../database-service';
import Header from './header';
import Sidebar from './Sidebar';
import './Layout.css';

const Layout = ({ children, currentPageName }) => {
  const [user, setUser] = useState(null);
  const [userCompany, setUserCompany] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        await loadUserCompany(user.email);
      } else {
        setUser(null);
        setUserCompany(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadUserCompany = async (email) => {
    try {
      const company = await dbService.getCompanyByEmail(email);
      setUserCompany(company);
    } catch (error) {
      console.error('Error loading user company:', error);
    }
  };

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  // Handle window resize to close sidebar on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="layout">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={handleSidebarClose}
        userCompany={userCompany}
      />

      {/* Main Content Area */}
      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Header */}
        <Header
          currentPageName={currentPageName}
          onMenuToggle={handleMenuToggle}
          userCompany={userCompany}
        />

        {/* Page Content */}
        <main className="page-content">
          <div className="page-wrapper">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;