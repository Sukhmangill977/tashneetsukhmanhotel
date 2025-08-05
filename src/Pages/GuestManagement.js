// pages/GuestManagement.js
import React, { useState, useEffect } from 'react';
import { auth } from '../firebase-config';
import { dbService } from '../database-service';
import Layout from '../components/Layout';
import GuestForm from '../components/GuestForm';
import GuestDetails from '../components/GuestDetails';
import './GuestManagement.css';

const GuestManagement = () => {
  const [userCompany, setUserCompany] = useState(null);
  const [guests, setguests] = useState([]);
  const [filteredguests, setFilteredguests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedguest, setSelectedguest] = useState(null);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [showGuestDetails, setShowGuestDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

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
    filterAndSortguests();
  }, [guests, searchTerm, sortBy, sortOrder]);

  const loadUserData = async (email) => {
    try {
      const company = await dbService.getCompanyByEmail(email);
      setUserCompany(company);
      
      if (company) {
        await loadguests(company.id);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadguests = async (companyId) => {
    try {
      const guestsData = await dbService.getguestsByCompany(companyId);
      setguests(guestsData);
    } catch (error) {
      console.error('Error loading guests:', error);
    }
  };

  const filterAndSortguests = () => {
    let filtered = guests.filter(guest => {
      const searchLower = searchTerm.toLowerCase();
      return (
        guest.name.toLowerCase().includes(searchLower) ||
        guest.roomNumber.toLowerCase().includes(searchLower) ||
        guest.email.toLowerCase().includes(searchLower) ||
        guest.phone.toLowerCase().includes(searchLower)
      );
    });

    // Sort guests
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'unit':
          aValue = parseInt(a.roomNumber) || 0;
          bValue = parseInt(b.roomNumber) || 0;
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'date':
          aValue = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          bValue = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredguests(filtered);
  };

  const handleAddguest = () => {
    setSelectedguest(null);
    setShowGuestForm(true);
  };

  const handleEditguest = (guest) => {
    setSelectedguest(guest);
    setShowGuestForm(true);
  };

  const handleViewguest = (guest) => {
    setSelectedguest(guest);
    setShowGuestDetails(true);
  };

  const handleDeleteguest = async (guest) => {
    if (window.confirm(`Are you sure you want to delete ${guest.name}?`)) {
      try {
        await dbService.deleteguest(guest.id);
        await loadguests(userCompany.id);
      } catch (error) {
        console.error('Error deleting guest:', error);
        alert('Error deleting guest. Please try again.');
      }
    }
  };

  const handleguestSubmit = async (guestData) => {
    try {
      if (selectedguest) {
        await dbService.updateguest(selectedguest.id, guestData);
      } else {
        await dbService.addguest(userCompany.id, guestData);
      }
      
      await loadguests(userCompany.id);
      setShowGuestForm(false);
      setSelectedguest(null);
    } catch (error) {
      console.error('Error saving guest:', error);
      throw error;
    }
  };

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Layout currentPageName="guest Management">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading guests...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPageName="guest Management">
      <div className="guest-management">
        {/* Page Header */}
        <div className="page-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title">guest Management</h1>
              <p className="page-description">
                Manage guest information, contacts, and unit assignments
              </p>
            </div>
            <div className="header-actions">
              <button className="primary-btn" onClick={handleAddguest}>
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Add guest
              </button>
            </div>
          </div>
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
              placeholder="Search guests by name, unit, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-controls">
            <div className="sort-dropdown">
              <label>Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="sort-select"
              >
                <option value="name">Name</option>
                <option value="unit">Unit Number</option>
                <option value="email">Email</option>
                <option value="date">Date Added</option>
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
            </div>

            <div className="results-count">
              {filteredguests.length} of {guests.length} guests
            </div>
          </div>
        </div>

        {/* guests Grid */}
        <div className="guests-container">
          {filteredguests.length > 0 ? (
            <div className="guests-grid">
              {filteredguests.map((guest) => (
                <div key={guest.id} className="guest-card">
                  <div className="guest-header">
                    <div className="guest-avatar">
                      {guest.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="guest-info">
                      <h3 className="guest-name">{guest.name}</h3>
                      <p className="guest-unit">Unit {guest.roomNumber}</p>
                    </div>
                    <div className="guest-actions">
                      <button
                        className="action-btn view"
                        onClick={() => handleViewguest(guest)}
                        title="View Details"
                      >
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </button>
                      <button
                        className="action-btn edit"
                        onClick={() => handleEditguest(guest)}
                        title="Edit guest"
                      >
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDeleteguest(guest)}
                        title="Delete guest"
                      >
                        <svg viewBox="0 0 24 24" fill="none">
                          <polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="guest-details">
                    <div className="detail-item">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/>
                        <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      <span>{guest.email}</span>
                    </div>
                    <div className="detail-item">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      <span>{guest.phone}</span>
                    </div>
                    <div className="detail-item">
                      <svg viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                        <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      <span>Added {formatDate(guest.createdAt)}</span>
                    </div>
                  </div>

                  <div className="guest-footer">
                    <button
                      className="contact-btn"
                      onClick={() => handleViewguest(guest)}
                    >
                      View Profile
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
                <h3>No guests found</h3>
                <p>
                  {searchTerm
                    ? `No guests match "${searchTerm}". Try adjusting your search.`
                    : 'Get started by adding your first guest.'}
                </p>
                <button className="primary-btn" onClick={handleAddguest}>
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Add First guest
                </button>
              </div>
            </div>
          )}
        </div>

        {/* guest Form Modal */}
        {showGuestForm && (
          <GuestForm
            guest={selectedguest}
            onSubmit={handleguestSubmit}
            onClose={() => {
              setShowGuestForm(false);
              setSelectedguest(null);
            }}
          />
        )}

        {/* guest Details Modal */}
        {showGuestDetails && selectedguest && (
          <GuestDetails
            guest={selectedguest}
            userCompany={userCompany}
            onEdit={() => {
              setShowGuestDetails(false);
              setShowGuestForm(true);
            }}
            onClose={() => {
              setShowGuestDetails(false);
              setSelectedguest(null);
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default GuestManagement;