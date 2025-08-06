// components/Layout.js
import React, { useState, useEffect } from 'react';
import { auth } from '../firebase-config';
import { dbService } from '../database-service';
import Header from './header';
import Sidebar from './Sidebar';
import './Layout.css';

const Layout = ({ children, currentPageName }) => {
  const [user, setUser] = useState(null);
  const [userHotel, setUserHotel] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        await loadUserHotel(user.email);
      } else {
        setUser(null);
        setUserHotel(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadUserHotel = async (email) => {
    try {
      const Hotel = await dbService.getHotelByEmail(email);
      setUserHotel(Hotel);
    } catch (error) {
      console.error('Error loading user Hotel:', error);
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
        userHotel={userHotel}
      />

      {/* Main Content Area */}
      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Header */}
        <Header
          currentPageName={currentPageName}
          onMenuToggle={handleMenuToggle}
          userHotel={userHotel}
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