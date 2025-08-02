// components/Header.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase-config';
import { signOut, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { dbService } from '../database-service';
import BookingForm from './BookingForm';
import MessageComposer from './MessageComposer';
import './header.css';

const Header = ({ currentPageName, onMenuToggle, userCompany }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [residents, setResidents] = useState([]);
  const [amenities, setAmenities] = useState([]);
  
  // Quick Actions Modals
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  
  // Profile Edit State
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: ''
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);
  const profileEditRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        const profile = await dbService.getUserProfile(user.uid);
        setUserProfile(profile);
        setProfileData({
          displayName: profile?.displayName || user.displayName || '',
          email: user.email || ''
        });
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    loadNotifications();
    loadResidents();
    loadAmenities();
  }, [userCompany]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (profileEditRef.current && !profileEditRef.current.contains(event.target)) {
        setShowProfileEdit(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    if (!userCompany) return;
    
    try {
      // Load recent issues and bookings for notifications
      const issues = await dbService.getIssuesByCompany(userCompany.id);
      const today = new Date();
      const todayBookings = await dbService.getBookingsByCompany(
        userCompany.id, 
        new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
      );

      const notificationList = [];
      
      // Add unresolved issues
      const openIssues = issues.filter(issue => issue.status === 'open');
      openIssues.slice(0, 3).forEach(issue => {
        notificationList.push({
          id: issue.id,
          type: 'issue',
          title: issue.title,
          message: `New complaint from Unit ${issue.unitNumber}`,
          time: issue.createdAt,
          urgent: issue.priority === 'urgent'
        });
      });

      // Add today's bookings
      todayBookings.slice(0, 2).forEach(booking => {
        notificationList.push({
          id: booking.id,
          type: 'booking',
          title: booking.title,
          message: `Booking today at ${booking.startDate.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
          time: booking.createdAt,
          urgent: false
        });
      });

      setNotifications(notificationList);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadResidents = async () => {
    if (!userCompany) return;
    try {
      const residentsData = await dbService.getResidentsByCompany(userCompany.id);
      setResidents(residentsData);
    } catch (error) {
      console.error('Error loading residents:', error);
    }
  };

  const loadAmenities = async () => {
    if (!userCompany) return;
    try {
      // Assuming amenities are stored in company data
      setAmenities(userCompany.amenities || []);
    } catch (error) {
      console.error('Error loading amenities:', error);
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

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage('');

    try {
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        displayName: profileData.displayName
      });

      // Update Firestore profile
      await dbService.updateUserProfile(auth.currentUser.uid, {
        displayName: profileData.displayName,
        updatedAt: new Date()
      });

      setProfileMessage('Profile updated successfully!');
      setUserProfile(prev => ({ ...prev, displayName: profileData.displayName }));
      
      setTimeout(() => {
        setShowProfileEdit(false);
        setProfileMessage('');
      }, 1500);
    } catch (error) {
      console.error('Error updating profile:', error);
      setProfileMessage('Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      await sendPasswordResetEmail(auth, user.email);
      setProfileMessage('Password reset email sent!');
    } catch (error) {
      console.error('Error sending password reset:', error);
      setProfileMessage('Failed to send password reset email');
    }
  };

  const handleQuickBooking = () => {
    setShowBookingModal(true);
    setShowUserMenu(false);
  };

  const handleQuickMessage = () => {
    setShowMessageModal(true);
    setShowUserMenu(false);
  };

  const handleBookingSubmit = async (bookingData) => {
    try {
      await dbService.createBooking(userCompany.id, bookingData);
      setShowBookingModal(false);
      // Optionally show success message or reload data
    } catch (error) {
      console.error('Error creating booking:', error);
    }
  };

  const handleMessageSubmit = async (messageData) => {
    try {
      // This would integrate with your Twilio service
      console.log('Sending message:', messageData);
      setShowMessageModal(false);
      // Optionally show success message
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatNotificationTime = (timestamp) => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffMinutes < 1440) {
      return `${Math.ceil(diffMinutes / 60)}h ago`;
    } else {
      return `${Math.ceil(diffMinutes / 1440)}d ago`;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'issue': return '⚠️';
      case 'booking': return '📅';
      case 'message': return '💬';
      case 'package': return '📦';
      default: return '🔔';
    }
  };

  return (
    <>
      <header className="header">
        <div className="header-left">
          <button className="menu-toggle" onClick={onMenuToggle}>
            <svg viewBox="0 0 24 24" fill="none">
              <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          
          <div className="page-info">
            <h1 className="page-title">{currentPageName}</h1>
            {userCompany && (
              <span className="company-name">{userCompany.name}</span>
            )}
          </div>
        </div>

        <div className="header-right">

          {/* Notifications */}
          <div className="notification-container" ref={notificationRef}>
            <button 
              className="notification-bell"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2"/>
              </svg>
              {notifications.length > 0 && (
                <span className="notification-badge">{notifications.length}</span>
              )}
            </button>

            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <h3>Notifications</h3>
                  <span className="notification-count">{notifications.length}</span>
                </div>
                <div className="notification-list">
                  {notifications.length === 0 ? (
                    <div className="notification-empty">
                      <div className="empty-icon">🔔</div>
                      <p>No notifications</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`notification-item ${notification.urgent ? 'urgent' : ''}`}
                      >
                        <div className="notification-icon">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="notification-content">
                          <h4>{notification.title}</h4>
                          <p>{notification.message}</p>
                          <span className="notification-time">
                            {formatNotificationTime(notification.time)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="notification-footer">
                    <button className="view-all-btn">View All</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="user-menu-container" ref={userMenuRef}>
            <button 
              className="user-menu-trigger"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="user-avatar">
                {(userProfile?.displayName || user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <span className="user-name">
                  {userProfile?.displayName || user?.displayName || 'User'}
                </span>
                <span className="user-role">Concierge</span>
              </div>
              <svg viewBox="0 0 24 24" fill="none" className="dropdown-arrow">
                <polyline points="6,9 12,15 18,9" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>

            {showUserMenu && (
              <div className="user-dropdown">
                <div className="dropdown-header">
                  <div className="user-avatar large">
                    {(userProfile?.displayName || user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="user-details">
                    <h4>{userProfile?.displayName || user?.displayName || 'User'}</h4>
                    <p>{user?.email}</p>
                  </div>
                </div>

                <div className="dropdown-section">
                  <h5>Quick Actions</h5>
                  <button className="dropdown-item" onClick={handleQuickBooking}>
                    <span className="item-icon">📅</span>
                    <span>New Booking</span>
                  </button>
                  <button className="dropdown-item" onClick={handleQuickMessage}>
                    <span className="item-icon">💬</span>
                    <span>Send Message</span>
                  </button>
                  <button className="dropdown-item" onClick={() => navigate('/packages')}>
                    <span className="item-icon">📦</span>
                    <span>Log Package</span>
                  </button>
                </div>

                <div className="dropdown-section">
                  <h5>Account</h5>
                  <button 
                    className="dropdown-item"
                    onClick={() => {
                      setShowProfileEdit(true);
                      setShowUserMenu(false);
                    }}
                  >
                    <span className="item-icon">✏️</span>
                    <span>Edit Profile</span>
                  </button>
                  <button className="dropdown-item" onClick={() => navigate('/settings')}>
                    <span className="item-icon">⚙️</span>
                    <span>Settings</span>
                  </button>
                </div>

                <div className="dropdown-divider"></div>
                
                <button className="dropdown-item logout" onClick={handleLogout}>
                  <span className="item-icon">🚪</span>
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Profile Edit Modal */}
      {showProfileEdit && (
        <div className="modal-overlay">
          <div className="profile-edit-modal" ref={profileEditRef}>
            <div className="modal-header">
              <h3>Edit Profile</h3>
              <button 
                className="close-btn"
                onClick={() => setShowProfileEdit(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProfileUpdate} className="profile-form">
              {profileMessage && (
                <div className={`profile-message ${profileMessage.includes('success') ? 'success' : 'error'}`}>
                  {profileMessage}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="displayName">Display Name</label>
                <input
                  type="text"
                  id="displayName"
                  value={profileData.displayName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Your display name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={profileData.email}
                  disabled
                  className="disabled"
                />
                <span className="help-text">Email cannot be changed</span>
              </div>

              <div className="password-section">
                <h4>Security</h4>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="password-reset-btn"
                >
                  <span className="btn-icon">🔒</span>
                  Send Password Reset Email
                </button>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowProfileEdit(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="save-btn"
                >
                  {profileSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Action Modals */}
      {showBookingModal && (
        <div className="modal-backdrop">
          <BookingForm
            residents={residents}
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
          residents={residents}
          type="individual"
        />
      )}
    </>
  );
};

export default Header;