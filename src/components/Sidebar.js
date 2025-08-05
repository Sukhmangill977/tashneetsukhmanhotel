import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../firebase-config';
import { signOut } from 'firebase/auth';
import { dbService } from '../database-service';
import BookingForm from './BookingForm';
import MessageComposer from './MessageComposer';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose, userCompany }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [guests, setguests] = useState([]);
  const [amenities, setAmenities] = useState([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        const profile = await dbService.getUserProfile(user.uid);
        setUserProfile(profile);
      }
    });
  
    return () => unsubscribe();
  }, []);
  

  useEffect(() => {
    loadUnreadCounts();
  }, [userCompany]);

  useEffect(() => {
    loadComponentData();
  }, [userCompany]);
  
  const loadComponentData = async () => {
    if (!userCompany) return;
    
    try {
      const guestsData = await dbService.getguestsByCompany(userCompany.id);
      setguests(guestsData);
      setAmenities(userCompany.amenities || []);
    } catch (error) {
      console.error('Error loading component data:', error);
    }
  };

  const handleQuickBooking = () => {
    setShowBookingModal(true);
  };
  
  const handleQuickMessage = () => {
    setShowMessageModal(true);
  };
  
  const handleBookingSubmit = async (bookingData) => {
    try {
      await dbService.createBooking(userCompany.id, bookingData);
      setShowBookingModal(false);
      // Optionally show success notification
    } catch (error) {
      console.error('Error creating booking:', error);
    }
  };
  
  const handleMessageSubmit = async (messageData) => {
    try {
      // This would integrate with your Twilio service
      console.log('Sending message:', messageData);
      setShowMessageModal(false);
      // Optionally show success notification
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const loadUnreadCounts = async () => {
    if (!userCompany) return;
    
    try {
      const maintenanceRequests = await dbService.getmaintenanceRequestsByCompany(userCompany.id);
      const openmaintenanceRequests = maintenanceRequests.filter(issue => issue.status === 'open');
      
      setUnreadCounts({
        messages: 3, // This would come from your messaging service
        complaints: openmaintenanceRequests.length,
        notifications: 5 // This would come from your notification service
      });
    } catch (error) {
      console.error('Error loading unread counts:', error);
    }
  };

  const navigationItems = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: (
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
          <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
          <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
          <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      description: 'Overview & Analytics'
    },
    {
      title: 'guest Management',
      path: '/guests',
      icon: (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
          <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      description: 'Manage guests & units'
    },
    {
      title: 'Amenity Booking',
      path: '/calendar',
      icon: (
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
          <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      description: 'Amenity reservations'
    },
    {
      title: 'Package Center',
      path: '/packages',
      icon: (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16V8z" stroke="currentColor" strokeWidth="2"/>
          <polyline points="3.27,6.96 12,12.01 20.73,6.96" stroke="currentColor" strokeWidth="2"/>
          <line x1="12" y1="22.08" x2="12" y2="12" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      description: 'Delivery management'
    },
    {
      title: 'Visitor Management',
      path: '/visitors',
      icon: (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
          <polyline points="17,11 19,13 23,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      description: 'Guest check-ins'
    },
    {
      title: 'Message Center',
      path: '/messages',
      icon: (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      description: 'SMS & Email hub',
      badge: unreadCounts.messages
    },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    if (onClose) {
      onClose();
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActivePage = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div className="sidebar-backdrop" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="brand-section">
            <div className="logo-container">
              <div className="logo-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="brand-text">
                <h1 className="brand-title">Claro AI</h1>
                <p className="brand-subtitle">HotelManagement</p>
              </div>
            </div>
            
            <button className="sidebar-close" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none">
                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* User Info Card */}
          <div className="user-card">
            <div className="user-avatar">
              {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <div className="user-details">
              <p className="user-name">
                {userProfile?.name || user?.displayName || 'User'}
              </p>
              <p className="user-email">{user?.email}</p>
              <p className="user-company">
                {userCompany?.name || 'Hotel Management'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <div className="nav-section">
            <h3 className="nav-section-title">Main Menu</h3>
            <div className="nav-items">
              {navigationItems.map((item) => {
                const isActive = isActivePage(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
                  >
                    <div className="nav-item-icon">
                      {item.icon}
                    </div>
                    <div className="nav-item-content">
                      <span className="nav-item-title">{item.title}</span>
                      <span className="nav-item-description">{item.description}</span>
                    </div>
                    {item.badge && (
                      <div className="nav-item-badge">
                        {item.badge}
                      </div>
                    )}
                    <div className="nav-item-arrow">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="nav-section">
  <h3 className="nav-section-title">Quick Actions</h3>
  <div className="quick-actions">
    <button 
      className="quick-action-btn primary reveal-on-hover"
      onClick={handleQuickBooking}
    >
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <div className="stat-icon">📆</div>
      <span className="hover-text">New Booking</span>
    </button>

    <button 
      className="quick-action-btn secondary reveal-on-hover"
      onClick={handleQuickMessage}
    >
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <div className="stat-icon">📩</div>
      <span className="hover-text">Send Message</span>
    </button>
  </div>
</div>

        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="footer-actions">
            <button 
              className="footer-btn"
              onClick={() => handleNavigation('/settings')}
            >
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Settings
            </button>
            
            <button className="footer-btn logout" onClick={handleLogout}>
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Sign Out
            </button>
          </div>

          {/* App Version */}
          <div className="app-info">
            <div className="version-badge">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <span>v1.0.0 Beta</span>
            </div>
            <p className="copyright">© 2025 Claro AI</p>
          </div>
        </div>
      </aside>

      {/* Quick Action Modals */}
        {showBookingModal && (
        <div className="modal-backdrop">
            <BookingForm
            guests={guests}
            amenities={amenities}
            onSubmit={handleBookingSubmit}
            onClose={() => setShowBookingModal(false)}
            />
        </div>
        )}

        {showMessageModal && (
        <MessageComposer
            isOpen={showMessageModal}
            onClose={() => setShowMessageModal(false)}
            onSend={handleMessageSubmit}
            guests={guests}
            type="individual"
        />
        )}
    </>
  );
};

export default Sidebar;