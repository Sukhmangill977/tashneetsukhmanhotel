// pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase-config';
import { dbService } from '../database-service';
import Layout from '../components/Layout';
import BookingForm from '../components/BookingForm';
import MessageComposer from '../components/MessageComposer';
import PackageForm from '../components/PackageForm';
import './Dashboard.css';
import { FaRegClipboard, FaEnvelope, FaBox } from 'react-icons/fa';
import { FaPhoneAlt, FaExclamationTriangle } from 'react-icons/fa';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userHotel, setUserHotel] = useState(null);//  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [guests, setguests] = useState([]);
  const [serviceBookings, setBookings] = useState([]);
  const [packages, setPackages] = useState([]);
  const [messages, setMessages] = useState([]);
  const [calls, setCalls] = useState([]);
  const [maintenanceRequests, setmaintenanceRequests] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [rooms, setRooms] = useState([]); // NEW: To manage room status
  // Modal states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  
  // Statistics
  const [stats, setStats] = useState({
    totalguests: 0,
    todaysBookings: 0,
    pendingPackages: 0,
    unreadMessages: 0,
    missedCalls: 0,
    openmaintenanceRequests: 0,
    todaysVisitors: 0,
    responseTime: 0
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        await loadDashboardData(user.email);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadDashboardData = async (email) => {
    try {
      const Hotel = await dbService.getHotelByEmail(email);
      setUserHotel(Hotel);
      
      if (Hotel) {
        await Promise.all([
          loadguests(Hotel.id),
          loadBookings(Hotel.id),
          loadPackages(Hotel.id),
          loadMessages(Hotel.id),
          loadCalls(Hotel.id),
          loadmaintenanceRequests(Hotel.id),
          loadVisitors(Hotel.id)
        ]);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const loadguests = async (hotelId) => {
    try {
      const data = await dbService.getguestsByHotel(hotelId);
      setguests(data);
    } catch (error) {
      console.error('Error loading guests:', error);
    }
  };

  const loadBookings = async (hotelId) => {
    try {
      const data = await dbService.getBookingsByHotel(hotelId);
      setBookings(data);
    } catch (error) {
      console.error('Error loading serviceBookings:', error);
    }
  };

  const loadPackages = async (hotelId) => {
    try {
      const data = await dbService.getPackagesByHotel(hotelId);
      setPackages(data);
    } catch (error) {
      console.error('Error loading packages:', error);
    }
  };

  const loadMessages = async (hotelId) => {
    try {
      const data = await dbService.getMessagesByHotel ? 
        await dbService.getMessagesByHotel(hotelId) : [];
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadCalls = async (hotelId) => {
    try {
      const data = await dbService.getCallLogsByHotel ? 
        await dbService.getCallLogsByHotel(hotelId) : [];
      setCalls(data);
    } catch (error) {
      console.error('Error loading calls:', error);
    }
  };

  const loadmaintenanceRequests = async (hotelId) => {
    try {
      const data = await dbService.getmaintenanceRequestsByHotel(hotelId);
      setmaintenanceRequests(data);
    } catch (error) {
      console.error('Error loading maintenanceRequests:', error);
    }
  };

  const loadVisitors = async (hotelId) => {
    try {
      const data = await dbService.getVisitorsByHotel ? 
        await dbService.getVisitorsByHotel(hotelId) : [];
      setVisitors(data);
    } catch (error) {
      console.error('Error loading visitors:', error);
    }
  };

  useEffect(() => {
    calculateStats();
  }, [guests, serviceBookings, packages, messages, calls, maintenanceRequests, visitors]);

  const calculateStats = () => {
    const today = new Date();
    const todayStr = today.toDateString();

    setStats({
      totalguests: guests.length,
      todaysBookings: serviceBookings.filter(b => {
        const bookingDate = b.startDate?.toDate ? b.startDate.toDate() : new Date(b.startDate);
        return bookingDate.toDateString() === todayStr;
      }).length,
      pendingPackages: packages.filter(p => p.status === 'pending').length,
      unreadMessages: messages.filter(m => !m.isRead && m.direction === 'incoming').length,
      missedCalls: calls.filter(c => c.status === 'missed').length,
      openmaintenanceRequests: maintenanceRequests.filter(i => i.status === 'open').length,
      todaysVisitors: visitors.filter(v => {
        const visitDate = v.expectedArrival?.toDate ? v.expectedArrival.toDate() : new Date(v.expectedArrival);
        return visitDate?.toDateString() === todayStr;
      }).length,
      responseTime: calculateAverageResponseTime()
    });
  };

  const calculateAverageResponseTime = () => {
    // Calculate average response time from messages
    const responseTimeSum = messages.reduce((sum, message, index) => {
      if (message.direction === 'outgoing' && index > 0) {
        const prevMessage = messages[index - 1];
        if (prevMessage.direction === 'incoming') {
          const responseTime = new Date(message.timestamp) - new Date(prevMessage.timestamp);
          return sum + responseTime;
        }
      }
      return sum;
    }, 0);
    
    const responseCount = messages.filter(m => m.direction === 'outgoing').length;
    return responseCount > 0 ? Math.round(responseTimeSum / responseCount / (1000 * 60)) : 0; // Return in minutes
  };

  const getTodaysBookings = () => {
    const today = new Date();
    const todayStr = today.toDateString();
    
    return serviceBookings
      .filter(booking => {
        const bookingDate = booking.startDate?.toDate ? booking.startDate.toDate() : new Date(booking.startDate);
        return bookingDate.toDateString() === todayStr;
      })
      .sort((a, b) => {
        const timeA = a.startDate?.toDate ? a.startDate.toDate() : new Date(a.startDate);
        const timeB = b.startDate?.toDate ? b.startDate.toDate() : new Date(b.startDate);
        return timeA - timeB;
      })
      .slice(0, 5);
  };

  const getRecentPackages = () => {
    return packages
      .filter(pkg => pkg.status === 'pending')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  };

  const getRecentMessages = () => {
    return messages
      .filter(msg => !msg.isRead && msg.direction === 'incoming')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);
  };

  const getRecentmaintenanceRequests = () => {
    return maintenanceRequests
      .filter(issue => issue.status === 'open')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  };

  const getTodaysVisitors = () => {
    const today = new Date().toDateString();
    
    return visitors
      .filter(visitor => {
        const visitDate = visitor.expectedArrival?.toDate ? visitor.expectedArrival.toDate() : new Date(visitor.expectedArrival);
        return visitDate?.toDateString() === today;
      })
      .sort((a, b) => {
        const timeA = a.expectedArrival?.toDate ? a.expectedArrival.toDate() : new Date(a.expectedArrival);
        const timeB = b.expectedArrival?.toDate ? b.expectedArrival.toDate() : new Date(b.expectedArrival);
        return timeA - timeB;
      })
      .slice(0, 5);
  };

  const formatTime = (timestamp) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleQuickBooking = async (bookingData) => {
    try {
      await dbService.serviceBookings(userHotel.id, bookingData);
      setShowBookingModal(false);
      await loadBookings(userHotel.id);
    } catch (error) {
      console.error('Error creating booking:', error);
    }
  };

  const handleQuickMessage = async (messageData) => {
    try {
      // This would integrate with Twilio
      console.log('Sending message:', messageData);
      setShowMessageModal(false);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleQuickPackage = async (packageData) => {
    try {
      await dbService.createParcel(userHotel.id, packageData);
      setShowPackageModal(false);
      await loadPackages(userHotel.id);
    } catch (error) {
      console.error('Error logging package:', error);
    }
  };

  if (loading) {
    return (
      <Layout currentPageName="Dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </Layout>
    );
  }

  const todaysBookings = getTodaysBookings();
  const recentPackages = getRecentPackages();
  const recentMessages = getRecentMessages();
  const recentmaintenanceRequests = getRecentmaintenanceRequests();
  const todaysVisitors = getTodaysVisitors();

  return (
    <Layout currentPageName="Dashboard">
      <div className="dashboard">
        {/* Welcome Header */}
        <div className="dashboard-header">
          <div className="welcome-section">
            <h1 className="welcome-title">
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}!
            </h1>
            <p className="welcome-subtitle">
              Here's what's happening at {userHotel?.name || 'your building'} today
            </p>
          </div>
          
          <div className="quick-actions-header">
  <button 
  className="quick-action-btn primary tooltip"
  onClick={() => setShowBookingModal(true)}
>
  <span className="btn-icon"><FaRegClipboard /></span>
  <span className="tooltip-text">New Booking</span>
</button>

<button 
  className="quick-action-btn secondary tooltip"
  onClick={() => setShowMessageModal(true)}
>
  <span className="btn-icon"><FaEnvelope /></span>
  <span className="tooltip-text">Send Message</span>
</button>

<button 
  className="quick-action-btn secondary tooltip"
  onClick={() => setShowPackageModal(true)}
>
  <span className="btn-icon"><FaBox /></span>
  <span className="tooltip-text">Log Package</span>
</button>

</div>

        </div>

        {/* Stats Overview */}
        <div className="stats-grid">
          <div className="stat-card guests" onClick={() => navigate('/guests')}>
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{stats.totalguests}</h3>
              <p>Total guests</p>
              <span className="stat-change">Active accounts</span>
            </div>
          </div>

         <div className="stat-card serviceBookings" onClick={() => navigate('/calendar')}>
  <div className="stat-icon"><FaRegClipboard /></div>
  <div className="stat-content">
    <h3>{stats.todaysBookings}</h3>
    <p>Today's Bookings</p>
    <span className="stat-change">Scheduled events</span>
  </div>
</div>

<div className="stat-card packages" onClick={() => navigate('/packages')}>
  <div className="stat-icon"><FaBox /></div>
  <div className="stat-content">
    <h3>{stats.pendingPackages}</h3>
    <p>Pending Packages</p>
    <span className="stat-change">Awaiting pickup</span>
  </div>
</div>

<div className="stat-card messages" onClick={() => navigate('/messages')}>
  <div className="stat-icon"><FaEnvelope /></div>
  <div className="stat-content">
    <h3>{stats.unreadMessages}</h3>
    <p>Unread Messages</p>
    <span className="stat-change">Need response</span>
  </div>
</div>

<div className="stat-card calls" onClick={() => navigate('/messages')}>
  <div className="stat-icon"><FaPhoneAlt /></div>
  <div className="stat-content">
    <h3>{stats.missedCalls}</h3>
    <p>Missed Calls</p>
    <span className="stat-change">Follow up needed</span>
  </div>
</div>

<div className="stat-card maintenanceRequests" onClick={() => navigate('/complaints')}>
  <div className="stat-icon"><FaExclamationTriangle /></div>
  <div className="stat-content">
    <h3>{stats.openmaintenanceRequests}</h3>
    <p>Open maintenanceRequests</p>
    <span className="stat-change">Require attention</span>
  </div>
</div>

          <div className="stat-card visitors" onClick={() => navigate('/visitors')}>
            <div className="stat-icon">🚪</div>
            <div className="stat-content">
              <h3>{stats.todaysVisitors}</h3>
              <p>Today's Visitors</p>
              <span className="stat-change">Expected arrivals</span>
            </div>
          </div>

          <div className="stat-card performance">
            <div className="stat-icon">⚡</div>
            <div className="stat-content">
              <h3>{stats.responseTime}m</h3>
              <p>Avg Response Time</p>
              <span className="stat-change">Messages & calls</span>
            </div>
          </div>
        </div>

        {/* Activity Sections */}
        <div className="activity-grid">
          {/* Today's Bookings */}
          <div className="activity-card">
            <div className="activity-header">
              <h3>Today's Bookings</h3>
              <button 
                className="view-all-btn"
                onClick={() => navigate('/calendar')}
              >
                View All
              </button>
            </div>
            <div className="activity-content">
              {todaysBookings.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📅</div>
                  <p>No serviceBookings scheduled for today</p>
                </div>
              ) : (
                <div className="activity-list">
                  {todaysBookings.map(booking => (
                    <div key={booking.id} className="activity-item">
                      <div className="activity-time">
                        {formatTime(booking.startDate)}
                      </div>
                      <div className="activity-details">
                        <h4>{booking.title}</h4>
                        <p>Unit {booking.contactInfo?.roomNumber || 'N/A'}</p>
                      </div>
                      <div className="activity-status confirmed">
                        {booking.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Packages */}
          <div className="activity-card">
            <div className="activity-header">
              <h3>Recent Packages</h3>
              <button 
                className="view-all-btn"
                onClick={() => navigate('/packages')}
              >
                View All
              </button>
            </div>
            <div className="activity-content">
              {recentPackages.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📦</div>
                  <p>No pending packages</p>
                </div>
              ) : (
                <div className="activity-list">
                  {recentPackages.map(pkg => (
                    <div key={pkg.id} className="activity-item">
                      <div className="activity-time">
                        {formatDate(pkg.createdAt)}
                      </div>
                      <div className="activity-details">
                        <h4>Unit {pkg.roomNumber}</h4>
                        <p>{pkg.courier} - {pkg.description}</p>
                      </div>
                      <div className="activity-status pending">
                        {pkg.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Unread Messages */}
          <div className="activity-card">
            <div className="activity-header">
              <h3>Unread Messages</h3>
              <button 
                className="view-all-btn"
                onClick={() => navigate('/messages')}
              >
                View All
              </button>
            </div>
            <div className="activity-content">
              {recentMessages.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💬</div>
                  <p>All messages read</p>
                </div>
              ) : (
                <div className="activity-list">
                  {recentMessages.map(msg => (
                    <div key={msg.id} className="activity-item">
                      <div className="activity-time">
                        {formatTime(msg.timestamp)}
                      </div>
                      <div className="activity-details">
                        <h4>{msg.guestName || msg.phoneNumber}</h4>
                        <p>{msg.content?.substring(0, 50)}...</p>
                      </div>
                      <div className="activity-status unread">
                        New
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Open maintenanceRequests */}
          <div className="activity-card">
            <div className="activity-header">
              <h3>Open maintenanceRequests</h3>
              <button 
                className="view-all-btn"
                onClick={() => navigate('/complaints')}
              >
                View All
              </button>
            </div>
            <div className="activity-content">
              {recentmaintenanceRequests.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">✅</div>
                  <p>No open maintenanceRequests</p>
                </div>
              ) : (
                <div className="activity-list">
                  {recentmaintenanceRequests.map(issue => (
                    <div key={issue.id} className="activity-item">
                      <div className="activity-time">
                        {formatDate(issue.createdAt)}
                      </div>
                      <div className="activity-details">
                        <h4>{issue.title}</h4>
                        <p>Unit {issue.roomNumber} - {issue.category}</p>
                      </div>
                      <div className={`activity-status ${issue.priority}`}>
                        {issue.priority}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Today's Visitors */}
          <div className="activity-card">
            <div className="activity-header">
              <h3>Today's Visitors</h3>
              <button 
                className="view-all-btn"
                onClick={() => navigate('/visitors')}
              >
                View All
              </button>
            </div>
            <div className="activity-content">
              {todaysVisitors.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🚪</div>
                  <p>No visitors expected today</p>
                </div>
              ) : (
                <div className="activity-list">
                  {todaysVisitors.map(visitor => (
                    <div key={visitor.id} className="activity-item">
                      <div className="activity-time">
                        {formatTime(visitor.expectedArrival)}
                      </div>
                      <div className="activity-details">
                        <h4>{visitor.name}</h4>
                        <p>Visiting Unit {visitor.roomNumber}</p>
                      </div>
                      <div className={`activity-status ${visitor.status}`}>
                        {visitor.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="activity-card full-width">
            <div className="activity-header">
              <h3>Recent Activity</h3>
              <button 
                className="view-all-btn"
                onClick={() => navigate('/settings')}
              >
                Activity Log
              </button>
            </div>
            <div className="activity-content">
              <div className="activity-timeline">
                <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <h4>New booking created</h4>
                    <p>Party Room A - Unit 205 - Tomorrow 7:00 PM</p>
                    <span className="timeline-time">5 minutes ago</span>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <h4>Package notification sent</h4>
                    <p>UPS delivery for Unit 301 - Notification sent via SMS</p>
                    <span className="timeline-time">12 minutes ago</span>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <h4>Issue resolved</h4>
                    <p>Noise complaint from Unit 405 - Resolved by management</p>
                    <span className="timeline-time">1 hour ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Modals */}
        {showBookingModal && (
          <div className="modal-backdrop">
            <BookingForm
              guests={guests}
              amenities={userHotel?.amenities || []}
              onSubmit={handleQuickBooking}
              onClose={() => setShowBookingModal(false)}
            />
          </div>
        )}

        {showMessageModal && (
          <MessageComposer
            isOpen={showMessageModal}
            onClose={() => setShowMessageModal(false)}
            onSend={handleQuickMessage}
            guests={guests}
            type="individual"
          />
        )}

        {showPackageModal && (
          <PackageForm
            guests={guests}
            onSubmit={handleQuickPackage}
            onClose={() => setShowPackageModal(false)}
          />
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;