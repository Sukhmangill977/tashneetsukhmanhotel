// components/ParkingRequestForm.js
import React, { useState, useEffect } from 'react';
import './ParkingRequestForm.css';

const ParkingRequestForm = ({ request, guests, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    requesterName: '',
    requesterPhone: '',
    requesterEmail: '',
    visiting: {
      guestId: '',
      guestName: '',
      roomNumber: ''
    },
    vehicleInfo: {
      make: '',
      model: '',
      year: '',
      color: '',
      licensePlate: ''
    },
    requestedDate: '',
    startTime: '',
    endTime: '',
    purpose: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (request) {
      // Edit mode - populate form with existing request data
      const requestDate = request.requestedDate.toDate ? request.requestedDate.toDate() : new Date(request.requestedDate);
      
      setFormData({
        requesterName: request.requesterName || '',
        requesterPhone: request.requesterPhone || '',
        requesterEmail: request.requesterEmail || '',
        visiting: {
          guestId: request.visiting?.guestId || '',
          guestName: request.visiting?.guestName || '',
          roomNumber: request.visiting?.roomNumber || ''
        },
        vehicleInfo: request.vehicleInfo || {
          make: '',
          model: '',
          year: '',
          color: '',
          licensePlate: ''
        },
        requestedDate: requestDate.toISOString().split('T')[0],
        startTime: request.startTime || '',
        endTime: request.endTime || '',
        purpose: request.purpose || '',
        notes: request.notes || ''
      });
    } else {
      // Create mode - set default values
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      setFormData(prev => ({
        ...prev,
        requestedDate: tomorrow.toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '17:00'
      }));
    }
  }, [request]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleguestChange = (e) => {
    const guestId = e.target.value;
    const selectedguest = guests.find(r => r.id === guestId);
    
    if (selectedguest) {
      setFormData(prev => ({
        ...prev,
        visiting: {
          guestId,
          guestName: selectedguest.name,
          roomNumber: selectedguest.roomNumber
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        visiting: {
          guestId: '',
          guestName: '',
          roomNumber: ''
        }
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.requesterName.trim()) {
      newErrors.requesterName = 'Requester name is required';
    }

    if (!formData.requesterPhone.trim()) {
      newErrors.requesterPhone = 'Phone number is required';
    }

    if (!formData.visiting.guestName.trim()) {
      newErrors['visiting.guestName'] = 'guest name is required';
    }

    if (!formData.visiting.roomNumber.trim()) {
      newErrors['visiting.roomNumber'] = 'Unit number is required';
    }

    if (!formData.vehicleInfo.make.trim()) {
      newErrors['vehicleInfo.make'] = 'Vehicle make is required';
    }

    if (!formData.vehicleInfo.licensePlate.trim()) {
      newErrors['vehicleInfo.licensePlate'] = 'License plate is required';
    }

    if (!formData.requestedDate) {
      newErrors.requestedDate = 'Requested date is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Purpose is required';
    }

    // Validate email if provided
    if (formData.requesterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.requesterEmail)) {
      newErrors.requesterEmail = 'Please enter a valid email address';
    }

    // Validate time logic
    if (formData.startTime && formData.endTime) {
      const [startHour, startMin] = formData.startTime.split(':').map(Number);
      const [endHour, endMin] = formData.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      if (endMinutes <= startMinutes) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    // Validate request date is not in the past
    if (formData.requestedDate) {
      const requestDate = new Date(formData.requestedDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (requestDate < today) {
        newErrors.requestedDate = 'Request date cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const requestDate = new Date(formData.requestedDate);

      const requestData = {
        requesterName: formData.requesterName.trim(),
        requesterPhone: formData.requesterPhone.trim(),
        requesterEmail: formData.requesterEmail.trim() || null,
        visiting: {
          guestId: formData.visiting.guestId || null,
          guestName: formData.visiting.guestName.trim(),
          roomNumber: formData.visiting.roomNumber.trim()
        },
        vehicleInfo: {
          make: formData.vehicleInfo.make.trim(),
          model: formData.vehicleInfo.model.trim(),
          year: formData.vehicleInfo.year.trim(),
          color: formData.vehicleInfo.color.trim(),
          licensePlate: formData.vehicleInfo.licensePlate.trim().toUpperCase()
        },
        requestedDate: requestDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        purpose: formData.purpose.trim(),
        notes: formData.notes.trim()
      };

      await onSubmit(requestData);
    } catch (error) {
      console.error('Error submitting parking request form:', error);
      setErrors({ general: 'Failed to save parking request. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const purposeOptions = [
    'Family Visit',
    'Friend Visit',
    'Business Meeting',
    'Medical Appointment',
    'Delivery/Moving',
    'Maintenance/Repair',
    'Special Event',
    'Other'
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="parking-request-form-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {request ? 'Edit parking Request' : 'New parking Request'}
          </h2>
          <button className="close-button" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none">
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="parking-request-form">
          {errors.general && (
            <div className="error-banner">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
                <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
              </svg>
              {errors.general}
            </div>
          )}

          <div className="form-section">
            <h3 className="section-title">Requester Information</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="requesterName" className="form-label">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="requesterName"
                  name="requesterName"
                  value={formData.requesterName}
                  onChange={handleInputChange}
                  className={`form-input ${errors.requesterName ? 'error' : ''}`}
                  placeholder="Full name"
                  required
                />
                {errors.requesterName && (
                  <span className="error-message">{errors.requesterName}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="requesterPhone" className="form-label">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="requesterPhone"
                  name="requesterPhone"
                  value={formData.requesterPhone}
                  onChange={handleInputChange}
                  className={`form-input ${errors.requesterPhone ? 'error' : ''}`}
                  placeholder="+1 (555) 123-4567"
                  required
                />
                {errors.requesterPhone && (
                  <span className="error-message">{errors.requesterPhone}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="requesterEmail" className="form-label">
                  Email Address
                </label>
                <input
                  type="email"
                  id="requesterEmail"
                  name="requesterEmail"
                  value={formData.requesterEmail}
                  onChange={handleInputChange}
                  className={`form-input ${errors.requesterEmail ? 'error' : ''}`}
                  placeholder="email@example.com"
                />
                {errors.requesterEmail && (
                  <span className="error-message">{errors.requesterEmail}</span>
                )}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Visiting Information</h3>
            
            <div className="form-group">
              <label htmlFor="guestId" className="form-label">
                Select guest
              </label>
              <select
                id="guestId"
                name="guestId"
                value={formData.visiting.guestId}
                onChange={handleguestChange}
                className="form-select"
              >
                <option value="">Select guest or enter manually</option>
                {guests.map(guest => (
                  <option key={guest.id} value={guest.id}>
                    {guest.name} - Unit {guest.roomNumber}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="guestName" className="form-label">
                  guest Name *
                </label>
                <input
                  type="text"
                  id="guestName"
                  name="visiting.guestName"
                  value={formData.visiting.guestName}
                  onChange={handleInputChange}
                  className={`form-input ${errors['visiting.guestName'] ? 'error' : ''}`}
                  placeholder="guest being visited"
                  required
                />
                {errors['visiting.guestName'] && (
                  <span className="error-message">{errors['visiting.guestName']}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="roomNumber" className="form-label">
                  Unit Number *
                </label>
                <input
                  type="text"
                  id="roomNumber"
                  name="visiting.roomNumber"
                  value={formData.visiting.roomNumber}
                  onChange={handleInputChange}
                  className={`form-input ${errors['visiting.roomNumber'] ? 'error' : ''}`}
                  placeholder="e.g., 101, 2A"
                  required
                />
                {errors['visiting.roomNumber'] && (
                  <span className="error-message">{errors['visiting.roomNumber']}</span>
                )}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Vehicle Information</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="vehicleMake" className="form-label">
                  Vehicle Make *
                </label>
                <input
                  type="text"
                  id="vehicleMake"
                  name="vehicleInfo.make"
                  value={formData.vehicleInfo.make}
                  onChange={handleInputChange}
                  className={`form-input ${errors['vehicleInfo.make'] ? 'error' : ''}`}
                  placeholder="e.g., Toyota, Honda"
                  required
                />
                {errors['vehicleInfo.make'] && (
                  <span className="error-message">{errors['vehicleInfo.make']}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="vehicleModel" className="form-label">
                  Vehicle Model
                </label>
                <input
                  type="text"
                  id="vehicleModel"
                  name="vehicleInfo.model"
                  value={formData.vehicleInfo.model}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="e.g., Camry, Civic"
                />
              </div>

              <div className="form-group">
                <label htmlFor="vehicleYear" className="form-label">
                  Year
                </label>
                <input
                  type="text"
                  id="vehicleYear"
                  name="vehicleInfo.year"
                  value={formData.vehicleInfo.year}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="e.g., 2021"
                />
              </div>

              <div className="form-group">
                <label htmlFor="vehicleColor" className="form-label">
                  Color
                </label>
                <input
                  type="text"
                  id="vehicleColor"
                  name="vehicleInfo.color"
                  value={formData.vehicleInfo.color}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="e.g., Silver, Black"
                />
              </div>

              <div className="form-group">
                <label htmlFor="licensePlate" className="form-label">
                  License Plate *
                </label>
                <input
                  type="text"
                  id="licensePlate"
                  name="vehicleInfo.licensePlate"
                  value={formData.vehicleInfo.licensePlate}
                  onChange={handleInputChange}
                  className={`form-input ${errors['vehicleInfo.licensePlate'] ? 'error' : ''}`}
                  placeholder="ABC 123"
                  required
                />
                {errors['vehicleInfo.licensePlate'] && (
                  <span className="error-message">{errors['vehicleInfo.licensePlate']}</span>
                )}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">parking Request Details</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="requestedDate" className="form-label">
                  Requested Date *
                </label>
                <input
                  type="date"
                  id="requestedDate"
                  name="requestedDate"
                  value={formData.requestedDate}
                  onChange={handleInputChange}
                  className={`form-input ${errors.requestedDate ? 'error' : ''}`}
                  required
                />
                {errors.requestedDate && (
                  <span className="error-message">{errors.requestedDate}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="startTime" className="form-label">
                  Start Time *
                </label>
                <input
                  type="time"
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className={`form-input ${errors.startTime ? 'error' : ''}`}
                  required
                />
                {errors.startTime && (
                  <span className="error-message">{errors.startTime}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="endTime" className="form-label">
                  End Time *
                </label>
                <input
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  className={`form-input ${errors.endTime ? 'error' : ''}`}
                  required
                />
                {errors.endTime && (
                  <span className="error-message">{errors.endTime}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="purpose" className="form-label">
                  Purpose *
                </label>
                <select
                  id="purpose"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  className={`form-select ${errors.purpose ? 'error' : ''}`}
                  required
                >
                  <option value="">Select purpose</option>
                  {purposeOptions.map(purpose => (
                    <option key={purpose} value={purpose}>
                      {purpose}
                    </option>
                  ))}
                </select>
                {errors.purpose && (
                  <span className="error-message">{errors.purpose}</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notes" className="form-label">
                Additional Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="form-textarea"
                placeholder="Any special requirements or additional information..."
                rows={3}
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading-spinner small"></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M9 9h2a2 2 0 012 2v1a2 2 0 01-2 2H9V9z" stroke="currentColor" strokeWidth="2"/>
                    <line x1="9" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  {request ? 'Update Request' : 'Submit Request'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ParkingRequestForm;