// pages/PackageCenter.js - Firebase Integrated
import React, { useState, useEffect } from 'react';
import { auth } from '../firebase-config';
import { dbService } from '../database-service';
import Layout from '../components/Layout';
import PackageForm from '../components/PackageForm';
import NotificationForm from '../components/NotificationForm';
import './PackageCenter.css';

const PackageCenter = () => {
  const [userCompany, setUserCompany] = useState(null);
  const [residents, setResidents] = useState([]);
  const [packages, setPackages] = useState([]);
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    pickedUp: 0,
    notified: 0
  });

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
    filterAndSortPackages();
  }, [packages, searchTerm, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    calculateStats();
  }, [packages]);

  const loadUserData = async (email) => {
    try {
      const company = await dbService.getCompanyByEmail(email);
      setUserCompany(company);
      
      if (company) {
        await Promise.all([
          loadResidents(company.id),
          loadPackages(company.id)
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

  const loadPackages = async (companyId) => {
    try {
      const packagesData = await dbService.getPackagesByCompany(companyId);
      setPackages(packagesData);
    } catch (error) {
      console.error('Error loading packages:', error);
    }
  };

  const calculateStats = () => {
    setStats({
      total: packages.length,
      pending: packages.filter(p => p.status === 'pending').length,
      pickedUp: packages.filter(p => p.status === 'picked_up').length,
      notified: packages.filter(p => p.notificationSent).length
    });
  };

  const filterAndSortPackages = () => {
    let filtered = packages.filter(pkg => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        pkg.residentName?.toLowerCase().includes(searchLower) ||
        pkg.unitNumber?.toLowerCase().includes(searchLower) ||
        pkg.courier?.toLowerCase().includes(searchLower) ||
        pkg.trackingNumber?.toLowerCase().includes(searchLower) ||
        pkg.description?.toLowerCase().includes(searchLower)
      );
      
      const matchesStatus = statusFilter === 'all' || pkg.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // Sort packages
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = a.deliveredAt || a.createdAt;
          bValue = b.deliveredAt || b.createdAt;
          break;
        case 'resident':
          aValue = a.residentName?.toLowerCase() || '';
          bValue = b.residentName?.toLowerCase() || '';
          break;
        case 'unit':
          aValue = parseInt(a.unitNumber) || 0;
          bValue = parseInt(b.unitNumber) || 0;
          break;
        case 'courier':
          aValue = a.courier?.toLowerCase() || '';
          bValue = b.courier?.toLowerCase() || '';
          break;
        default:
          aValue = a.deliveredAt || a.createdAt;
          bValue = b.deliveredAt || b.createdAt;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredPackages(filtered);
  };

  const handleAddPackage = () => {
    setSelectedPackage(null);
    setShowPackageForm(true);
  };

  const handleEditPackage = (pkg) => {
    setSelectedPackage(pkg);
    setShowPackageForm(true);
  };

  const handleNotifyResident = (pkg) => {
    setSelectedPackage(pkg);
    setShowNotificationForm(true);
  };

  const handleMarkPickedUp = async (pkg) => {
    try {
      await dbService.markPackageAsPickedUp(pkg.id, {
        pickupBy: pkg.residentName,
        verification: 'front_desk_confirmation',
        notes: 'Picked up at front desk'
      });
      
      // Reload packages
      await loadPackages(userCompany.id);
      
      // Log activity
      await dbService.logActivity(userCompany.id, {
        type: 'package_pickup',
        description: `Package picked up by ${pkg.residentName} for Unit ${pkg.unitNumber}`,
        packageId: pkg.id,
        residentId: pkg.residentId
      });
      
    } catch (error) {
      console.error('Error marking package as picked up:', error);
      alert('Failed to mark package as picked up. Please try again.');
    }
  };

  const handleDeletePackage = async (pkg) => {
    if (window.confirm('Are you sure you want to delete this package record?')) {
      try {
        await dbService.deletePackage(pkg.id);
        await loadPackages(userCompany.id);
        
        // Log activity
        await dbService.logActivity(userCompany.id, {
          type: 'package_deleted',
          description: `Package record deleted for Unit ${pkg.unitNumber}`,
          packageId: pkg.id
        });
        
      } catch (error) {
        console.error('Error deleting package:', error);
        alert('Failed to delete package. Please try again.');
      }
    }
  };

  const handlePackageSubmit = async (packageData) => {
    try {
      if (selectedPackage) {
        // Update existing package
        await dbService.updatePackage(selectedPackage.id, packageData);
        
        // Log activity
        await dbService.logActivity(userCompany.id, {
          type: 'package_updated',
          description: `Package updated for Unit ${packageData.unitNumber}`,
          packageId: selectedPackage.id
        });
      } else {
        // Create new package
        const packageId = await dbService.createPackage(userCompany.id, packageData);
        
        // Auto-send notification if resident is found and notification is enabled
        if (packageData.residentId && packageData.autoNotify) {
          try {
            await dbService.sendPackageNotification(packageId, packageData.residentId, 'arrival');
          } catch (notificationError) {
            console.error('Error sending auto-notification:', notificationError);
            // Don't fail the package creation if notification fails
          }
        }
        
        // Log activity
        await dbService.logActivity(userCompany.id, {
          type: 'package_created',
          description: `New package logged for Unit ${packageData.unitNumber} from ${packageData.courier}`,
          packageId
        });
      }
      
      // Reload packages and close form
      await loadPackages(userCompany.id);
      setShowPackageForm(false);
      setSelectedPackage(null);
      
    } catch (error) {
      console.error('Error saving package:', error);
      alert('Failed to save package. Please try again.');
    }
  };

  const handleNotificationSubmit = async (notificationData) => {
    try {
      // Send notification via your messaging service
      if (selectedPackage && selectedPackage.residentId) {
        await dbService.sendPackageNotification(
          selectedPackage.id, 
          selectedPackage.residentId, 
          notificationData.type || 'arrival'
        );
      }
      
      // Reload packages
      await loadPackages(userCompany.id);
      setShowNotificationForm(false);
      setSelectedPackage(null);
      
      alert('Notification sent successfully!');
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification. Please try again.');
    }
  };

  const handleBulkActions = async (action, selectedPackageIds) => {
    try {
      switch (action) {
        case 'mark_picked_up':
          await dbService.markMultiplePackagesAsPickedUp(selectedPackageIds, {
            pickupBy: 'Bulk Update',
            verification: 'bulk_confirmation'
          });
          break;
        case 'send_notifications':
          await dbService.sendBulkPackageNotifications(selectedPackageIds, 'reminder');
          break;
        default:
          console.warn('Unknown bulk action:', action);
      }
      
      await loadPackages(userCompany.id);
    } catch (error) {
      console.error('Error performing bulk action:', error);
      alert('Failed to perform bulk action. Please try again.');
    }
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'picked_up': return '#10b981';
      case 'returned': return '#6b7280';
      case 'damaged': return '#ef4444';
      case 'lost': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending Pickup';
      case 'picked_up': return 'Picked Up';
      case 'returned': return 'Returned';
      case 'damaged': return 'Damaged';
      case 'lost': return 'Lost';
      default: return status;
    }
  };

  if (loading) {
    return (
      <Layout currentPageName="Package Center">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading packages...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPageName="Package Center">
      <div className="package-center">
        {/* Page Header */}
        <div className="page-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title">Package Center</h1>
              <p className="page-description">
                Manage package deliveries and notifications
              </p>
            </div>
            <div className="header-actions">
              <button className="primary-btn" onClick={handleAddPackage}>
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Log New Package
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total">📦</div>
            <div className="stat-content">
              <h3>{stats.total}</h3>
              <p>Total Packages</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon pending">⏳</div>
            <div className="stat-content">
              <h3>{stats.pending}</h3>
              <p>Pending Pickup</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon picked-up">✅</div>
            <div className="stat-content">
              <h3>{stats.pickedUp}</h3>
              <p>Picked Up</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon notified">📱</div>
            <div className="stat-content">
              <h3>{stats.notified}</h3>
              <p>Notified</p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search packages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <div className="filter-controls">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="picked_up">Picked Up</option>
              <option value="returned">Returned</option>
              <option value="damaged">Damaged</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="date">Sort by Date</option>
              <option value="resident">Sort by Resident</option>
              <option value="unit">Sort by Unit</option>
              <option value="courier">Sort by Courier</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="sort-toggle"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* Package List */}
        <div className="packages-container">
          {filteredPackages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>No packages found</h3>
              <p>
                {searchTerm || statusFilter !== 'all' 
                  ? 'No packages match your current filters.'
                  : 'No packages have been registered yet.'}
              </p>
              <button className="primary-btn" onClick={handleAddPackage}>
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Log First Package
              </button>
            </div>
          ) : (
            <div className="packages-list">
              {filteredPackages.map((pkg) => (
                <div key={pkg.id} className="package-item">
                  <div className="package-header">
                    <div className="package-info">
                      <h4 className="resident-name">{pkg.residentName}</h4>
                      <p className="unit-number">Unit {pkg.unitNumber}</p>
                    </div>
                    <div className="package-status">
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(pkg.status) }}
                      >
                        {getStatusText(pkg.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="package-details">
                    <div className="detail-row">
                      <span className="detail-label">Courier:</span>
                      <span className="detail-value">{pkg.courier}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Description:</span>
                      <span className="detail-value">{pkg.description}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Delivered:</span>
                      <span className="detail-value">{formatDateTime(pkg.deliveredAt)}</span>
                    </div>
                    {pkg.trackingNumber && (
                      <div className="detail-row">
                        <span className="detail-label">Tracking:</span>
                        <span className="detail-value tracking">{pkg.trackingNumber}</span>
                      </div>
                    )}
                    {pkg.pickedUpAt && (
                      <div className="detail-row">
                        <span className="detail-label">Picked up:</span>
                        <span className="detail-value">{formatDateTime(pkg.pickedUpAt)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="package-actions">
                    {pkg.status === 'pending' && (
                      <>
                        <button
                          className="action-btn notify-btn"
                          onClick={() => handleNotifyResident(pkg)}
                          disabled={pkg.notificationSent}
                        >
                          {pkg.notificationSent ? 'Notified' : 'Notify'}
                        </button>
                        <button
                          className="action-btn pickup-btn"
                          onClick={() => handleMarkPickedUp(pkg)}
                        >
                          Mark Picked Up
                        </button>
                      </>
                    )}
                    <button
                      className="action-btn edit-btn"
                      onClick={() => handleEditPackage(pkg)}
                    >
                      Edit
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDeletePackage(pkg)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Package Form Modal */}
        {showPackageForm && (
          <PackageForm
            package={selectedPackage}
            residents={residents}
            onSubmit={handlePackageSubmit}
            onClose={() => {
              setShowPackageForm(false);
              setSelectedPackage(null);
            }}
          />
        )}

        {/* Notification Form Modal */}
        {showNotificationForm && (
          <NotificationForm
            package={selectedPackage}
            residents={residents}
            onSubmit={handleNotificationSubmit}
            onClose={() => {
              setShowNotificationForm(false);
              setSelectedPackage(null);
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default PackageCenter;