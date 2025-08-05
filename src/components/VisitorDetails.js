// components/VisitorDetails.js
import React from 'react';
import './VisitorDetails.css';

const VisitorDetails = ({ visitor, onEdit, onClose }) => {
  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'Not set';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Not set';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Not set';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pre_registered': return '#3b82f6';
      case 'checked_in': return '#10b981';
      case 'checked_out': return '#6b7280';
      case 'no_show': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pre_registered': return 'Pre-Registered';
      case 'checked_in': return 'Checked In';
      case 'checked_out': return 'Checked Out';
      case 'no_show': return 'No Show';
      default: return status;
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="visitor-details-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="visitor-header-info">
            <div className="visitor-avatar large">
              {visitor.name.charAt(0).toUpperCase()}
            </div>
            <div className="visitor-info">
              <h2 className="visitor-name">{visitor.name}</h2>
              <p className="visitor-purpose">{visitor.purpose}</p>
              <div className="visitor-status-info">
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(visitor.status) }}
                >
                  {getStatusText(visitor.status)}
                </span>
              </div>
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

        <div className="modal-content">
          <div className="details-grid">
            {/* Contact Information */}
            <div className="info-card">
              <h3 className="card-title">Contact Information</h3>
              <div className="info-list">
                <div className="info-item">
                  <span className="info-label">Phone:</span>
                  <span className="info-value">{visitor.phone || 'Not provided'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{visitor.email || 'Not provided'}</span>
                </div>
              </div>
            </div>

            {/* Visit Information */}
            <div className="info-card">
              <h3 className="card-title">Visit Information</h3>
              <div className="info-list">
                <div className="info-item">
                  <span className="info-label">Visiting:</span>
                  <span className="info-value">{visitor.visiting.guestName}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Unit:</span>
                  <span className="info-value">Unit {visitor.visiting.roomNumber}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Purpose:</span>
                  <span className="info-value">{visitor.purpose}</span>
                </div>
              </div>
            </div>

            {/* Schedule Information */}
            <div className="info-card">
              <h3 className="card-title">Schedule</h3>
              <div className="info-list">
                <div className="info-item">
                  <span className="info-label">Expected Arrival:</span>
                  <span className="info-value">{formatDateTime(visitor.expectedArrival)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Expected Departure:</span>
                  <span className="info-value">{formatDateTime(visitor.expectedDeparture)}</span>
                </div>
                {visitor.actualArrival && (
                  <div className="info-item">
                    <span className="info-label">Actual Arrival:</span>
                    <span className="info-value">{formatDateTime(visitor.actualArrival)}</span>
                  </div>
                )}
                {visitor.actualDeparture && (
                  <div className="info-item">
                    <span className="info-label">Actual Departure:</span>
                    <span className="info-value">{formatDateTime(visitor.actualDeparture)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Access Information */}
            <div className="info-card">
              <h3 className="card-title">Access Information</h3>
              <div className="info-list">
                <div className="info-item">
                  <span className="info-label">Access Code:</span>
                  <span className="info-value">{visitor.accessCode || 'Not assigned'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Badge Printed:</span>
                  <span className="info-value">
                    {visitor.badgePrinted ? (
                      <span className="status-indicator success">Yes</span>
                    ) : (
                      <span className="status-indicator pending">No</span>
                    )}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Notification Sent:</span>
                  <span className="info-value">
                    {visitor.notificationSent ? (
                      <span className="status-indicator success">Yes</span>
                    ) : (
                      <span className="status-indicator pending">No</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Vehicle Information */}
            {(visitor.vehicleInfo || visitor.parkingSpot) && (
              <div className="info-card">
                <h3 className="card-title">Vehicle & parking</h3>
                <div className="info-list">
                  {visitor.vehicleInfo && (
                    <>
                      <div className="info-item">
                        <span className="info-label">Vehicle:</span>
                        <span className="info-value">
                          {visitor.vehicleInfo.year} {visitor.vehicleInfo.make} {visitor.vehicleInfo.model}
                          {visitor.vehicleInfo.color && ` (${visitor.vehicleInfo.color})`}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">License Plate:</span>
                        <span className="info-value">{visitor.vehicleInfo.licensePlate}</span>
                      </div>
                    </>
                  )}
                  {visitor.parkingSpot && (
                    <div className="info-item">
                      <span className="info-label">parking Spot:</span>
                      <span className="info-value">{visitor.parkingSpot}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Processing Information */}
            <div className="info-card">
              <h3 className="card-title">Processing Information</h3>
              <div className="info-list">
                <div className="info-item">
                  <span className="info-label">Registered:</span>
                  <span className="info-value">{formatDateTime(visitor.createdAt)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Last Updated:</span>
                  <span className="info-value">{formatDateTime(visitor.updatedAt)}</span>
                </div>
                {visitor.checkedInBy && (
                  <div className="info-item">
                    <span className="info-label">Checked In By:</span>
                    <span className="info-value">{visitor.checkedInBy}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {visitor.notes && (
            <div className="notes-section">
              <h3 className="section-title">Additional Notes</h3>
              <div className="notes-content">
                <p>{visitor.notes}</p>
              </div>
            </div>
          )}

          {/* Timeline Section */}
          <div className="timeline-section">
            <h3 className="section-title">Visit Timeline</h3>
            <div className="timeline">
              <div className="timeline-item completed">
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <h4>Visitor Registered</h4>
                  <p>{formatDateTime(visitor.createdAt)}</p>
                </div>
              </div>
              
              {visitor.notificationSent && (
                <div className="timeline-item completed">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <h4>guest Notified</h4>
                    <p>Notification sent to guest</p>
                  </div>
                </div>
              )}
              
              {visitor.actualArrival && (
                <div className="timeline-item completed">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <h4>Visitor Checked In</h4>
                    <p>{formatDateTime(visitor.actualArrival)}</p>
                    {visitor.checkedInBy && <span>By: {visitor.checkedInBy}</span>}
                  </div>
                </div>
              )}
              
              {visitor.status === 'checked_in' && !visitor.actualDeparture && (
                <div className="timeline-item current">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <h4>Currently in Building</h4>
                    <p>Expected departure: {formatTime(visitor.expectedDeparture)}</p>
                  </div>
                </div>
              )}
              
              {visitor.actualDeparture && (
                <div className="timeline-item completed">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <h4>Visitor Checked Out</h4>
                    <p>{formatDateTime(visitor.actualDeparture)}</p>
                  </div>
                </div>
              )}
              
              {visitor.status === 'no_show' && (
                <div className="timeline-item failed">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <h4>No Show</h4>
                    <p>Visitor did not arrive as expected</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitorDetails;