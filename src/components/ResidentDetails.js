// components/ResidentDetails.js
import React, { useState, useEffect } from 'react';
import { dbService } from '../database-service';
import './ResidentDetails.css';

const ResidentDetails = ({ resident, userCompany, onEdit, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [residentData, setResidentData] = useState({
    bookings: [],
    issues: [],
    messages: [],
    visitors: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResidentData();
  }, [resident]);

  const loadResidentData = async () => {
    if (!resident || !userCompany) return;
    
    setLoading(true);
    try {
      // Load all related data for this resident
      const [bookings, issues] = await Promise.all([
        dbService.getBookingsByCompany(userCompany.id),
        dbService.getIssuesByCompany(userCompany.id)
      ]);

      // Filter data for this specific resident
      const residentBookings = bookings.filter(booking => 
        booking.residentId === resident.id ||
        booking.contactInfo?.email === resident.email
      );

      const residentIssues = issues.filter(issue => 
        issue.residentId === resident.id ||
        issue.unitNumber === resident.unitNumber
      );

      setResidentData({
        bookings: residentBookings,
        issues: residentIssues,
        messages: [], // TODO: Implement when message system is ready
        visitors: []  // TODO: Implement when visitor system is ready
      });
    } catch (error) {
      console.error('Error loading resident data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString([], { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString([], { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      case 'open': return '#ef4444';
      case 'in-progress': return '#f59e0b';
      case 'resolved': return '#10b981';
      case 'closed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': case 'urgent': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getAmenityName = (amenityId) => {
    return userCompany?.amenities?.find(a => a.id === amenityId)?.name || amenityId;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '👤' },
    { id: 'bookings', label: 'Bookings', icon: '📅', count: residentData.bookings.length },
    { id: 'issues', label: 'Issues', icon: '⚠️', count: residentData.issues.length },
    { id: 'messages', label: 'Messages', icon: '💬', count: residentData.messages.length },
    { id: 'visitors', label: 'Visitors', icon: '👥', count: residentData.visitors.length }
  ];

  const renderOverviewTab = () => (
    <div className="tab-content">
      <div className="overview-grid">
        <div className="info-card">
          <h3>Contact Information</h3>
          <div className="info-list">
            <div className="info-item">
              <span className="info-label">Email:</span>
              <span className="info-value">{resident.email}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Phone:</span>
              <span className="info-value">{resident.phone}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Unit:</span>
              <span className="info-value">Unit {resident.unitNumber}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Resident Since:</span>
              <span className="info-value">{formatDate(resident.createdAt)}</span>
            </div>
          </div>
        </div>

        {resident.emergencyContact && resident.emergencyContact.name && (
          <div className="info-card">
            <h3>Emergency Contact</h3>
            <div className="info-list">
              <div className="info-item">
                <span className="info-label">Name:</span>
                <span className="info-value">{resident.emergencyContact.name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Phone:</span>
                <span className="info-value">{resident.emergencyContact.phone}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Relationship:</span>
                <span className="info-value">{resident.emergencyContact.relationship}</span>
              </div>
            </div>
          </div>
        )}

        <div className="info-card">
          <h3>Activity Summary</h3>
          <div className="activity-stats">
            <div className="stat-item">
              <div className="stat-number">{residentData.bookings.length}</div>
              <div className="stat-label">Total Bookings</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{residentData.issues.length}</div>
              <div className="stat-label">Issues Reported</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{residentData.messages.length}</div>
              <div className="stat-label">Messages</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{residentData.visitors.length}</div>
              <div className="stat-label">Visitors</div>
            </div>
          </div>
        </div>

        {resident.notes && (
          <div className="info-card full-width">
            <h3>Notes</h3>
            <p className="notes-content">{resident.notes}</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderBookingsTab = () => (
    <div className="tab-content">
      {residentData.bookings.length > 0 ? (
        <div className="data-list">
          {residentData.bookings
            .sort((a, b) => {
              const dateA = a.startDate.toDate ? a.startDate.toDate() : new Date(a.startDate);
              const dateB = b.startDate.toDate ? b.startDate.toDate() : new Date(b.startDate);
              return dateB - dateA; // Most recent first
            })
            .map((booking) => (
            <div key={booking.id} className="data-item">
              <div className="data-header">
                <h4 className="data-title">{booking.title}</h4>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(booking.status) }}
                >
                  {booking.status}
                </span>
              </div>
              <div className="data-details">
                <div className="detail-row">
                  <span className="detail-label">Date:</span>
                  <span className="detail-value">
                    {formatDate(booking.startDate)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Time:</span>
                  <span className="detail-value">
                    {formatTime(booking.startDate)} - {formatTime(booking.endDate)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Amenity:</span>
                  <span className="detail-value">
                    {getAmenityName(booking.amenityId)}
                  </span>
                </div>
                {booking.notes && (
                  <div className="detail-row">
                    <span className="detail-label">Notes:</span>
                    <span className="detail-value">{booking.notes}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-label">Booked:</span>
                  <span className="detail-value">{formatDate(booking.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-tab">
          <div className="empty-icon">📅</div>
          <h3>No Bookings</h3>
          <p>This resident hasn't made any bookings yet.</p>
        </div>
      )}
    </div>
  );

  const renderIssuesTab = () => (
    <div className="tab-content">
      {residentData.issues.length > 0 ? (
        <div className="data-list">
          {residentData.issues
            .sort((a, b) => {
              const dateA = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
              const dateB = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
              return dateB - dateA; // Most recent first
            })
            .map((issue) => (
            <div key={issue.id} className="data-item">
              <div className="data-header">
                <h4 className="data-title">{issue.title}</h4>
                <div className="issue-badges">
                  <span 
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(issue.priority) }}
                  >
                    {issue.priority || 'normal'}
                  </span>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(issue.status) }}
                  >
                    {issue.status}
                  </span>
                </div>
              </div>
              <div className="data-details">
                <div className="detail-row">
                  <span className="detail-label">Category:</span>
                  <span className="detail-value">{issue.category}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Reported:</span>
                  <span className="detail-value">{formatDate(issue.createdAt)}</span>
                </div>
                {issue.description && (
                  <div className="detail-row">
                    <span className="detail-label">Description:</span>
                    <span className="detail-value">{issue.description}</span>
                  </div>
                )}
                {issue.assignedTo && (
                  <div className="detail-row">
                    <span className="detail-label">Assigned To:</span>
                    <span className="detail-value">{issue.assignedTo}</span>
                  </div>
                )}
                {issue.messages && issue.messages.length > 0 && (
                  <div className="detail-row">
                    <span className="detail-label">Updates:</span>
                    <span className="detail-value">{issue.messages.length} message(s)</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-tab">
          <div className="empty-icon">⚠️</div>
          <h3>No Issues</h3>
          <p>This resident hasn't reported any issues.</p>
        </div>
      )}
    </div>
  );

  const renderMessagesTab = () => (
    <div className="tab-content">
      <div className="empty-tab">
        <div className="empty-icon">💬</div>
        <h3>Messages Coming Soon</h3>
        <p>Message history will be available when the messaging system is implemented.</p>
        <div className="feature-preview">
          <h4>Coming Features:</h4>
          <ul>
            <li>SMS message history</li>
            <li>Email correspondence</li>
            <li>Call logs and recordings</li>
            <li>Automated notifications</li>
            <li>Message templates</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderVisitorsTab = () => (
    <div className="tab-content">
      <div className="empty-tab">
        <div className="empty-icon">👥</div>
        <h3>Visitors Coming Soon</h3>
        <p>Visitor history will be available when the visitor management system is implemented.</p>
        <div className="feature-preview">
          <h4>Coming Features:</h4>
          <ul>
            <li>Guest check-in/check-out logs</li>
            <li>Visitor parking requests</li>
            <li>Pre-authorized visitor lists</li>
            <li>Visitor badges and access codes</li>
            <li>Delivery and service personnel tracking</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverviewTab();
      case 'bookings': return renderBookingsTab();
      case 'issues': return renderIssuesTab();
      case 'messages': return renderMessagesTab();
      case 'visitors': return renderVisitorsTab();
      default: return renderOverviewTab();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="resident-details-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="resident-header-info">
            <div className="resident-avatar large">
              {resident.name.charAt(0).toUpperCase()}
            </div>
            <div className="resident-info">
              <h2 className="resident-name">{resident.name}</h2>
              <p className="resident-unit">Unit {resident.unitNumber}</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="edit-button" onClick={onEdit}>
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Edit
            </button>
            <button className="close-button" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none">
                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="tab-navigation">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="tab-count">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="modal-content">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading resident data...</p>
            </div>
          ) : (
            renderTabContent()
          )}
        </div>
      </div>
    </div>
  );
};

export default ResidentDetails;