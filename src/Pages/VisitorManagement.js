// pages/VisitorManagement.js
import React, { useState, useEffect } from 'react';
import { auth } from '../firebase-config';
import { dbService } from '../database-service';
import Layout from '../components/Layout';
import VisitorForm from '../components/VisitorForm';
import ParkingRequestForm from '../components/ParkingRequestForm';
import VisitorDetails from '../components/VisitorDetails';
import NotificationForm from '../components/NotificationForm';
import './VisitorManagement.css';

const VisitorManagement = () => {
  const [userCompany, setUserCompany] = useState(null);
  const [residents, setResidents] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [parkingRequests, setParkingRequests] = useState([]);
  const [filteredVisitors, setFilteredVisitors] = useState([]);
  const [filteredParkingRequests, setFilteredParkingRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('visitors');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [showVisitorForm, setShowVisitorForm] = useState(false);
  const [showParkingForm, setShowParkingForm] = useState(false);
  const [showVisitorDetails, setShowVisitorDetails] = useState(false);
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        await loadUserData(user.email);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    filterAndSortData();
  }, [visitors, parkingRequests, searchTerm, statusFilter, dateFilter, sortBy, sortOrder, activeTab]);

  const loadUserData = async (email) => {
    try {
      const company = await dbService.getCompanyByEmail(email);
      setUserCompany(company);
      
      if (company) {
        await Promise.all([
          loadResidents(company.id),
          loadVisitors(company.id),
          loadParkingRequests(company.id)
        ]);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadResidents = async (companyId) => {
    try {
      const residentsData = await dbService.getResidentsByCompany(companyId);
      setResidents(residentsData);
    } catch (error) {
      console.error('Error loading residents:', error);
    }
  };

  const loadVisitors = async (companyId) => {
    try {
      const visitorsData = await dbService.getVisitorsByCompany(companyId);
      setVisitors(visitorsData);
    } catch (error) {
      console.error('Error loading visitors:', error);
    }
  };

  const loadParkingRequests = async (companyId) => {
    try {
      const parkingData = await dbService.getParkingRequestsByCompany(companyId);
      setParkingRequests(parkingData);
    } catch (error) {
      console.error('Error loading parking requests:', error);
    }
  };

  const filterAndSortData = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (activeTab === 'visitors') {
      let filtered = visitors.filter(visitor => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (
          visitor.name.toLowerCase().includes(searchLower) ||
          visitor.visiting.residentName.toLowerCase().includes(searchLower) ||
          visitor.visiting.unitNumber.toLowerCase().includes(searchLower) ||
          visitor.purpose.toLowerCase().includes(searchLower) ||
          (visitor.phone && visitor.phone.toLowerCase().includes(searchLower))
        );
        
        const matchesStatus = statusFilter === 'all' || visitor.status === statusFilter;
        
        let matchesDate = true;
        const visitorDate = visitor.expectedArrival.toDate ? visitor.expectedArrival.toDate() : new Date(visitor.expectedArrival);
        
        switch (dateFilter) {
          case 'today':
            matchesDate = visitorDate.toDateString() === today.toDateString();
            break;
          case 'yesterday':
            matchesDate = visitorDate.toDateString() === yesterday.toDateString();
            break;
          case 'tomorrow':
            matchesDate = visitorDate.toDateString() === tomorrow.toDateString();
            break;
          case 'week':
            const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            matchesDate = visitorDate >= today && visitorDate <= weekFromNow;
            break;
          case 'all':
          default:
            matchesDate = true;
        }
        
        return matchesSearch && matchesStatus && matchesDate;
      });

      // Sort visitors
      filtered.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'resident':
            aValue = a.visiting.residentName.toLowerCase();
            bValue = b.visiting.residentName.toLowerCase();
            break;
          case 'unit':
            aValue = parseInt(a.visiting.unitNumber) || 0;
            bValue = parseInt(b.visiting.unitNumber) || 0;
            break;
          case 'status':
            aValue = a.status.toLowerCase();
            bValue = b.status.toLowerCase();
            break;
          case 'date':
          default:
            aValue = a.expectedArrival.toDate ? a.expectedArrival.toDate() : new Date(a.expectedArrival);
            bValue = b.expectedArrival.toDate ? b.expectedArrival.toDate() : new Date(b.expectedArrival);
        }

        if (sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });

      setFilteredVisitors(filtered);
    } else {
      let filtered = parkingRequests.filter(request => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (
          request.requesterName.toLowerCase().includes(searchLower) ||
          request.visiting.residentName.toLowerCase().includes(searchLower) ||
          request.visiting.unitNumber.toLowerCase().includes(searchLower) ||
          (request.vehicleInfo.licensePlate && request.vehicleInfo.licensePlate.toLowerCase().includes(searchLower)) ||
          (request.vehicleInfo.make && request.vehicleInfo.make.toLowerCase().includes(searchLower))
        );
        
        const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
        
        let matchesDate = true;
        const requestDate = request.requestedDate.toDate ? request.requestedDate.toDate() : new Date(request.requestedDate);
        
        switch (dateFilter) {
          case 'today':
            matchesDate = requestDate.toDateString() === today.toDateString();
            break;
          case 'tomorrow':
            matchesDate = requestDate.toDateString() === tomorrow.toDateString();
            break;
          case 'week':
            const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            matchesDate = requestDate >= today && requestDate <= weekFromNow;
            break;
          case 'all':
          default:
            matchesDate = true;
        }
        
        return matchesSearch && matchesStatus && matchesDate;
      });

      // Sort parking requests
      filtered.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
          case 'name':
            aValue = a.requesterName.toLowerCase();
            bValue = b.requesterName.toLowerCase();
            break;
          case 'resident':
            aValue = a.visiting.residentName.toLowerCase();
            bValue = b.visiting.residentName.toLowerCase();
            break;
          case 'unit':
            aValue = parseInt(a.visiting.unitNumber) || 0;
            bValue = parseInt(b.visiting.unitNumber) || 0;
            break;
          case 'status':
            aValue = a.status.toLowerCase();
            bValue = b.status.toLowerCase();
            break;
          case 'date':
          default:
            aValue = a.requestedDate.toDate ? a.requestedDate.toDate() : new Date(a.requestedDate);
            bValue = b.requestedDate.toDate ? b.requestedDate.toDate() : new Date(b.requestedDate);
        }

        if (sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });

      setFilteredParkingRequests(filtered);
    }
  };

  const handleAddVisitor = () => {
    setSelectedVisitor(null);
    setShowVisitorForm(true);
  };

  const handleAddParkingRequest = () => {
    setSelectedRequest(null);
    setShowParkingForm(true);
  };

  const handleEditVisitor = (visitor) => {
    setSelectedVisitor(visitor);
    setShowVisitorForm(true);
  };

  const handleEditParkingRequest = (request) => {
    setSelectedRequest(request);
    setShowParkingForm(true);
  };

  const handleViewVisitor = (visitor) => {
    setSelectedVisitor(visitor);
    setShowVisitorDetails(true);
  };

  const handleCheckIn = async (visitor) => {
    try {
      const updateData = {
        status: 'checked_in',
        actualArrival: new Date(),
        checkedInBy: auth.currentUser?.email || 'Front Desk'
      };
      
      await dbService.updateVisitor(visitor.id, updateData);
      await loadVisitors(userCompany.id);
      
      // Send notification to resident
      // This would integrate with your messaging service
      console.log('Visitor checked in, notifying resident');
    } catch (error) {
      console.error('Error checking in visitor:', error);
    }
  };

  const handleCheckOut = async (visitor) => {
    try {
      const updateData = {
        status: 'checked_out',
        actualDeparture: new Date()
      };
      
      await dbService.updateVisitor(visitor.id, updateData);
      await loadVisitors(userCompany.id);
    } catch (error) {
      console.error('Error checking out visitor:', error);
    }
  };

  const handleApproveParkingRequest = async (request) => {
    try {
      const updateData = {
        status: 'approved',
        approvedBy: auth.currentUser?.email || 'Front Desk',
        approvedAt: new Date(),
        accessCode: generateAccessCode(),
        parkingSpot: assignParkingSpot()
      };
      
      await dbService.updateParkingRequest(request.id, updateData);
      await loadParkingRequests(userCompany.id);
      
      // Send SMS notification
      await sendParkingApprovalNotification(request, updateData);
    } catch (error) {
      console.error('Error approving parking request:', error);
    }
  };

  const handleDenyParkingRequest = async (request) => {
    try {
      const updateData = {
        status: 'denied',
        approvedBy: auth.currentUser?.email || 'Front Desk',
        approvedAt: new Date()
      };
      
      await dbService.updateParkingRequest(request.id, updateData);
      await loadParkingRequests(userCompany.id);
      
      // Send SMS notification
      await sendParkingDenialNotification(request);
    } catch (error) {
      console.error('Error denying parking request:', error);
    }
  };

  const handleVisitorSubmit = async (visitorData) => {
    try {
      if (selectedVisitor) {
        await dbService.updateVisitor(selectedVisitor.id, visitorData);
      } else {
        await dbService.createVisitor(userCompany.id, visitorData);
      }
      
      await loadVisitors(userCompany.id);
      setShowVisitorForm(false);
      setSelectedVisitor(null);
    } catch (error) {
      console.error('Error saving visitor:', error);
      throw error;
    }
  };

  const handleParkingRequestSubmit = async (requestData) => {
    try {
      if (selectedRequest) {
        await dbService.updateParkingRequest(selectedRequest.id, requestData);
      } else {
        await dbService.createParkingRequest(userCompany.id, requestData);
      }
      
      await loadParkingRequests(userCompany.id);
      setShowParkingForm(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error saving parking request:', error);
      throw error;
    }
  };

  const handleNotifyVisitor = (visitor) => {
    setSelectedVisitor(visitor);
    setShowNotificationForm(true);
  };

  const handleNotificationSubmit = async (notificationData) => {
    try {
      // This would integrate with your Twilio/messaging service
      console.log('Sending notification:', notificationData);
      
      // Update visitor notification status
      if (selectedVisitor) {
        await dbService.updateVisitor(selectedVisitor.id, {
          notificationSent: true,
          lastNotificationAt: new Date()
        });
        await loadVisitors(userCompany.id);
      }
      
      setShowNotificationForm(false);
      setSelectedVisitor(null);
      
      alert('Notification sent successfully!');
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  };

  const generateAccessCode = () => {
    return 'VIS' + Math.random().toString(36).substr(2, 4).toUpperCase();
  };

  const assignParkingSpot = () => {
    // Simple parking spot assignment logic
    const spots = ['V-1', 'V-2', 'V-3', 'V-4', 'V-5', 'V-6', 'V-7', 'V-8', 'V-9', 'V-10'];
    return spots[Math.floor(Math.random() * spots.length)];
  };

  const sendParkingApprovalNotification = async (request, approvalData) => {
    // This would integrate with your Twilio SMS service
    const message = `Your parking request for ${formatDate(request.requestedDate)} has been APPROVED. Parking spot: ${approvalData.parkingSpot}, Access code: ${approvalData.accessCode}. Building Management.`;
    console.log('Sending approval SMS to', request.requesterPhone, ':', message);
  };

  const sendParkingDenialNotification = async (request) => {
    // This would integrate with your Twilio SMS service
    const message = `Your parking request for ${formatDate(request.requestedDate)} has been denied. Please contact building management for more information.`;
    console.log('Sending denial SMS to', request.requesterPhone, ':', message);
  };

  const formatDate = (timestamp) => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timestamp) => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateTime = (timestamp) => {
    return `${formatDate(timestamp)} at ${formatTime(timestamp)}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pre_registered': return '#3b82f6';
      case 'checked_in': return '#10b981';
      case 'checked_out': return '#6b7280';
      case 'no_show': return '#ef4444';
      case 'pending': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'denied': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pre_registered': return 'Pre-Registered';
      case 'checked_in': return 'Checked In';
      case 'checked_out': return 'Checked Out';
      case 'no_show': return 'No Show';
      case 'pending': return 'Pending';
      case 'approved': return 'Approved';
      case 'denied': return 'Denied';
      default: return status;
    }
  };

  const getVisitorStats = () => {
    const today = new Date().toDateString();
    return {
      total: visitors.length,
      checkedIn: visitors.filter(v => v.status === 'checked_in').length,
      expected: visitors.filter(v => {
        const visitorDate = v.expectedArrival.toDate ? v.expectedArrival.toDate() : new Date(v.expectedArrival);
        return visitorDate.toDateString() === today && v.status === 'pre_registered';
      }).length,
      pendingParking: parkingRequests.filter(r => r.status === 'pending').length
    };
  };

  if (loading) {
    return (
      <Layout currentPageName="Visitor Management">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading visitor data...</p>
        </div>
      </Layout>
    );
  }

  const stats = getVisitorStats();

  return (
    <Layout currentPageName="Visitor Management">
      <div className="visitor-management">
        {/* Page Header */}
        <div className="page-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title">Visitor Management</h1>
              <p className="page-description">
                Manage guest check-ins, parking requests, and visitor access
              </p>
            </div>
            <div className="header-actions">
              <button className="secondary-btn" onClick={handleAddParkingRequest}>
                <svg viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M21 15.5c-1 0-3 1-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12.5c-2 0-5 2-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Parking Request
              </button>
              <button className="primary-btn" onClick={handleAddVisitor}>
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Register Visitor
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-icon active">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                <polyline points="17,11 19,13 23,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.checkedIn}</div>
              <div className="stat-label">Currently In Building</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon expected">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.expected}</div>
              <div className="stat-label">Expected Today</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon parking">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M9 9h2a2 2 0 012 2v1a2 2 0 01-2 2H9V9z" stroke="currentColor" strokeWidth="2"/>
                <line x1="9" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.pendingParking}</div>
              <div className="stat-label">Parking Requests</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon total">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Total Visitors</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === 'visitors' ? 'active' : ''}`}
            onClick={() => setActiveTab('visitors')}
          >
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Visitors ({filteredVisitors.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'parking' ? 'active' : ''}`}
            onClick={() => setActiveTab('parking')}
          >
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M9 9h2a2 2 0 012 2v1a2 2 0 01-2 2H9V9z" stroke="currentColor" strokeWidth="2"/>
              <line x1="9" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Parking Requests ({filteredParkingRequests.length})
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="search-filter-bar">
          <div className="search-container">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              placeholder={activeTab === 'visitors' ? 
                "Search visitors by name, resident, unit..." : 
                "Search parking requests by name, license plate..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-controls">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              {activeTab === 'visitors' ? (
                <>
                  <option value="pre_registered">Pre-Registered</option>
                  <option value="checked_in">Checked In</option>
                  <option value="checked_out">Checked Out</option>
                  <option value="no_show">No Show</option>
                </>
              ) : (
                <>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="denied">Denied</option>
                </>
              )}
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              {activeTab === 'visitors' && <option value="yesterday">Yesterday</option>}
              <option value="tomorrow">Tomorrow</option>
              <option value="week">This Week</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="resident">Sort by Resident</option>
              <option value="unit">Sort by Unit</option>
              <option value="status">Sort by Status</option>
            </select>

            <button
              className="sort-order-btn"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <svg viewBox="0 0 24 24" fill="none">
                {sortOrder === 'asc' ? (
                  <path d="M3 8l4-4m0 0l4 4m-4-4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                ) : (
                  <path d="M3 16l4 4m0 0l4-4m-4 4V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                )}
              </svg>
            </button>

            <div className="results-count">
              {activeTab === 'visitors' ? filteredVisitors.length : filteredParkingRequests.length} results
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="content-container">
          {activeTab === 'visitors' ? (
            filteredVisitors.length > 0 ? (
              <div className="visitors-list">
                {filteredVisitors.map((visitor) => (
                  <div key={visitor.id} className="visitor-card">
                    <div className="visitor-header">
                      <div className="visitor-info">
                        <h3 className="visitor-name">{visitor.name}</h3>
                        <div className="visitor-meta">
                          <span className="visiting-info">
                            Visiting {visitor.visiting.residentName} • Unit {visitor.visiting.unitNumber}
                          </span>
                          <span className="visit-time">
                            {formatDateTime(visitor.expectedArrival)}
                          </span>
                        </div>
                      </div>
                      <div className="visitor-status">
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(visitor.status) }}
                        >
                          {getStatusText(visitor.status)}
                        </span>
                      </div>
                    </div>

                    <div className="visitor-details">
                      <div className="detail-row">
                        <span className="detail-label">Purpose:</span>
                        <span className="detail-value">{visitor.purpose}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Phone:</span>
                        <span className="detail-value">{visitor.phone || 'Not provided'}</span>
                      </div>
                      {visitor.expectedDeparture && (
                        <div className="detail-row">
                          <span className="detail-label">Expected Departure:</span>
                          <span className="detail-value">{formatTime(visitor.expectedDeparture)}</span>
                        </div>
                      )}
                      {visitor.actualArrival && (
                        <div className="detail-row">
                          <span className="detail-label">Arrived:</span>
                          <span className="detail-value">{formatDateTime(visitor.actualArrival)}</span>
                        </div>
                      )}
                      {visitor.parkingSpot && (
                        <div className="detail-row">
                          <span className="detail-label">Parking:</span>
                          <span className="detail-value">Spot {visitor.parkingSpot}</span>
                        </div>
                      )}
                      {visitor.accessCode && (
                        <div className="detail-row">
                          <span className="detail-label">Access Code:</span>
                          <span className="detail-value">{visitor.accessCode}</span>
                        </div>
                      )}
                    </div>

                    <div className="visitor-actions">
                      {visitor.status === 'pre_registered' && (
                        <button
                          className="action-btn checkin"
                          onClick={() => handleCheckIn(visitor)}
                        >
                          <svg viewBox="0 0 24 24" fill="none">
                            <polyline points="20,6 9,17 4,12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Check In
                        </button>
                      )}
                      {visitor.status === 'checked_in' && (
                        <button
                          className="action-btn checkout"
                          onClick={() => handleCheckOut(visitor)}
                        >
                          <svg viewBox="0 0 24 24" fill="none">
                            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Check Out
                        </button>
                      )}
                      <button
                        className="action-btn notify"
                        onClick={() => handleNotifyVisitor(visitor)}
                      >
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Notify
                      </button>
                      <button
                        className="action-btn view"
                        onClick={() => handleViewVisitor(visitor)}
                      >
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        View
                      </button>
                      <button
                        className="action-btn edit"
                        onClick={() => handleEditVisitor(visitor)}
                      >
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-content">
                  <svg viewBox="0 0 24 24" fill="none" className="empty-icon">
                    <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                    <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h3>No visitors found</h3>
                  <p>
                    {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                      ? 'No visitors match your current filters.'
                      : 'No visitors have been registered yet.'}
                  </p>
                  <button className="primary-btn" onClick={handleAddVisitor}>
                    <svg viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Register First Visitor
                  </button>
                </div>
              </div>
            )
          ) : (
            filteredParkingRequests.length > 0 ? (
              <div className="parking-requests-list">
                {filteredParkingRequests.map((request) => (
                  <div key={request.id} className="parking-request-card">
                    <div className="request-header">
                      <div className="request-info">
                        <h3 className="requester-name">{request.requesterName}</h3>
                        <div className="request-meta">
                          <span className="visiting-info">
                            Visiting {request.visiting.residentName} • Unit {request.visiting.unitNumber}
                          </span>
                          <span className="request-date">
                            {formatDate(request.requestedDate)} • {request.startTime} - {request.endTime}
                          </span>
                        </div>
                      </div>
                      <div className="request-status">
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(request.status) }}
                        >
                          {getStatusText(request.status)}
                        </span>
                      </div>
                    </div>

                    <div className="request-details">
                      <div className="detail-row">
                        <span className="detail-label">Vehicle:</span>
                        <span className="detail-value">
                          {request.vehicleInfo.year} {request.vehicleInfo.make} {request.vehicleInfo.model} ({request.vehicleInfo.color})
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">License:</span>
                        <span className="detail-value">{request.vehicleInfo.licensePlate}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Purpose:</span>
                        <span className="detail-value">{request.purpose}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Phone:</span>
                        <span className="detail-value">{request.requesterPhone}</span>
                      </div>
                      {request.parkingSpot && (
                        <div className="detail-row">
                          <span className="detail-label">Assigned Spot:</span>
                          <span className="detail-value">{request.parkingSpot}</span>
                        </div>
                      )}
                      {request.accessCode && (
                        <div className="detail-row">
                          <span className="detail-label">Access Code:</span>
                          <span className="detail-value">{request.accessCode}</span>
                        </div>
                      )}
                      {request.approvedBy && (
                        <div className="detail-row">
                          <span className="detail-label">Processed by:</span>
                          <span className="detail-value">{request.approvedBy}</span>
                        </div>
                      )}
                    </div>

                    <div className="request-actions">
                      {request.status === 'pending' && (
                        <>
                          <button
                            className="action-btn approve"
                            onClick={() => handleApproveParkingRequest(request)}
                          >
                            <svg viewBox="0 0 24 24" fill="none">
                              <polyline points="20,6 9,17 4,12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Approve
                          </button>
                          <button
                            className="action-btn deny"
                            onClick={() => handleDenyParkingRequest(request)}
                          >
                            <svg viewBox="0 0 24 24" fill="none">
                              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            Deny
                          </button>
                        </>
                      )}
                      <button
                        className="action-btn edit"
                        onClick={() => handleEditParkingRequest(request)}
                      >
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-content">
                  <svg viewBox="0 0 24 24" fill="none" className="empty-icon">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M9 9h2a2 2 0 012 2v1a2 2 0 01-2 2H9V9z" stroke="currentColor" strokeWidth="2"/>
                    <line x1="9" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <h3>No parking requests found</h3>
                  <p>
                    {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                      ? 'No parking requests match your current filters.'
                      : 'No parking requests have been submitted yet.'}
                  </p>
                  <button className="primary-btn" onClick={handleAddParkingRequest}>
                    <svg viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Add Parking Request
                  </button>
                </div>
              </div>
            )
          )}
        </div>

        {/* Modal Forms */}
        {showVisitorForm && (
          <VisitorForm
            visitor={selectedVisitor}
            residents={residents}
            onSubmit={handleVisitorSubmit}
            onClose={() => {
              setShowVisitorForm(false);
              setSelectedVisitor(null);
            }}
          />
        )}

        {showParkingForm && (
          <ParkingRequestForm
            request={selectedRequest}
            residents={residents}
            onSubmit={handleParkingRequestSubmit}
            onClose={() => {
              setShowParkingForm(false);
              setSelectedRequest(null);
            }}
          />
        )}

        {showVisitorDetails && selectedVisitor && (
          <VisitorDetails
            visitor={selectedVisitor}
            onEdit={() => {
              setShowVisitorDetails(false);
              setShowVisitorForm(true);
            }}
            onClose={() => {
              setShowVisitorDetails(false);
              setSelectedVisitor(null);
            }}
          />
        )}

        {showNotificationForm && (
          <NotificationForm
            visitor={selectedVisitor}
            residents={residents}
            onSubmit={handleNotificationSubmit}
            onClose={() => {
              setShowNotificationForm(false);
              setSelectedVisitor(null);
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default VisitorManagement;