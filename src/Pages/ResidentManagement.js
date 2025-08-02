// pages/ResidentManagement.js
import React, { useState, useEffect } from 'react';
import { auth } from '../firebase-config';
import { dbService } from '../database-service';
import Layout from '../components/Layout';
import ResidentForm from '../components/ResidentForm';
import ResidentDetails from '../components/ResidentDetails';
import './ResidentManagement.css';

const ResidentManagement = () => {
  const [userCompany, setUserCompany] = useState(null);
  const [residents, setResidents] = useState([]);
  const [filteredResidents, setFilteredResidents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResident, setSelectedResident] = useState(null);
  const [showResidentForm, setShowResidentForm] = useState(false);
  const [showResidentDetails, setShowResidentDetails] = useState(false);
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
    filterAndSortResidents();
  }, [residents, searchTerm, sortBy, sortOrder]);

  const loadUserData = async (email) => {
    try {
      const company = await dbService.getCompanyByEmail(email);
      setUserCompany(company);
      
      if (company) {
        await loadResidents(company.id);
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

  const filterAndSortResidents = () => {
    let filtered = residents.filter(resident => {
      const searchLower = searchTerm.toLowerCase();
      return (
        resident.name.toLowerCase().includes(searchLower) ||
        resident.unitNumber.toLowerCase().includes(searchLower) ||
        resident.email.toLowerCase().includes(searchLower) ||
        resident.phone.toLowerCase().includes(searchLower)
      );
    });

    // Sort residents
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'unit':
          aValue = parseInt(a.unitNumber) || 0;
          bValue = parseInt(b.unitNumber) || 0;
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

    setFilteredResidents(filtered);
  };

  const handleAddResident = () => {
    setSelectedResident(null);
    setShowResidentForm(true);
  };

  const handleEditResident = (resident) => {
    setSelectedResident(resident);
    setShowResidentForm(true);
  };

  const handleViewResident = (resident) => {
    setSelectedResident(resident);
    setShowResidentDetails(true);
  };

  const handleDeleteResident = async (resident) => {
    if (window.confirm(`Are you sure you want to delete ${resident.name}?`)) {
      try {
        await dbService.deleteResident(resident.id);
        await loadResidents(userCompany.id);
      } catch (error) {
        console.error('Error deleting resident:', error);
        alert('Error deleting resident. Please try again.');
      }
    }
  };

  const handleResidentSubmit = async (residentData) => {
    try {
      if (selectedResident) {
        await dbService.updateResident(selectedResident.id, residentData);
      } else {
        await dbService.addResident(userCompany.id, residentData);
      }
      
      await loadResidents(userCompany.id);
      setShowResidentForm(false);
      setSelectedResident(null);
    } catch (error) {
      console.error('Error saving resident:', error);
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
      <Layout currentPageName="Resident Management">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading residents...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPageName="Resident Management">
      <div className="resident-management">
        {/* Page Header */}
        <div className="page-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title">Resident Management</h1>
              <p className="page-description">
                Manage resident information, contacts, and unit assignments
              </p>
            </div>
            <div className="header-actions">
              <button className="primary-btn" onClick={handleAddResident}>
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Add Resident
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
              placeholder="Search residents by name, unit, email, or phone..."
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
              {filteredResidents.length} of {residents.length} residents
            </div>
          </div>
        </div>

        {/* Residents Grid */}
        <div className="residents-container">
          {filteredResidents.length > 0 ? (
            <div className="residents-grid">
              {filteredResidents.map((resident) => (
                <div key={resident.id} className="resident-card">
                  <div className="resident-header">
                    <div className="resident-avatar">
                      {resident.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="resident-info">
                      <h3 className="resident-name">{resident.name}</h3>
                      <p className="resident-unit">Unit {resident.unitNumber}</p>
                    </div>
                    <div className="resident-actions">
                      <button
                        className="action-btn view"
                        onClick={() => handleViewResident(resident)}
                        title="View Details"
                      >
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </button>
                      <button
                        className="action-btn edit"
                        onClick={() => handleEditResident(resident)}
                        title="Edit Resident"
                      >
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDeleteResident(resident)}
                        title="Delete Resident"
                      >
                        <svg viewBox="0 0 24 24" fill="none">
                          <polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="resident-details">
                    <div className="detail-item">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/>
                        <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      <span>{resident.email}</span>
                    </div>
                    <div className="detail-item">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      <span>{resident.phone}</span>
                    </div>
                    <div className="detail-item">
                      <svg viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                        <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      <span>Added {formatDate(resident.createdAt)}</span>
                    </div>
                  </div>

                  <div className="resident-footer">
                    <button
                      className="contact-btn"
                      onClick={() => handleViewResident(resident)}
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
                <h3>No residents found</h3>
                <p>
                  {searchTerm
                    ? `No residents match "${searchTerm}". Try adjusting your search.`
                    : 'Get started by adding your first resident.'}
                </p>
                <button className="primary-btn" onClick={handleAddResident}>
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Add First Resident
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Resident Form Modal */}
        {showResidentForm && (
          <ResidentForm
            resident={selectedResident}
            onSubmit={handleResidentSubmit}
            onClose={() => {
              setShowResidentForm(false);
              setSelectedResident(null);
            }}
          />
        )}

        {/* Resident Details Modal */}
        {showResidentDetails && selectedResident && (
          <ResidentDetails
            resident={selectedResident}
            userCompany={userCompany}
            onEdit={() => {
              setShowResidentDetails(false);
              setShowResidentForm(true);
            }}
            onClose={() => {
              setShowResidentDetails(false);
              setSelectedResident(null);
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default ResidentManagement;