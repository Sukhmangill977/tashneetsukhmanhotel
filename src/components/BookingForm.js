// components/BookingForm.js
import React, { useState, useEffect } from 'react';
import './BookingForm.css';

const BookingForm = ({ booking, residents, amenities, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    amenityId: '',
    residentId: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    notes: '',
    contactInfo: {
      name: '',
      phone: '',
      email: ''
    },
    status: 'confirmed'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (booking) {
      // Edit mode - populate form with existing booking data
      const startDate = booking.startDate.toDate ? booking.startDate.toDate() : new Date(booking.startDate);
      const endDate = booking.endDate.toDate ? booking.endDate.toDate() : new Date(booking.endDate);
      
      setFormData({
        title: booking.title || '',
        amenityId: booking.amenityId || '',
        residentId: booking.residentId || '',
        startDate: startDate.toISOString().split('T')[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endDate: endDate.toISOString().split('T')[0],
        endTime: endDate.toTimeString().slice(0, 5),
        notes: booking.notes || '',
        contactInfo: booking.contactInfo || {
          name: '',
          phone: '',
          email: ''
        },
        status: booking.status || 'confirmed'
      });
    } else {
      // Create mode - set default values
      const now = new Date();
      const defaultStart = new Date(now);
      defaultStart.setHours(9, 0, 0, 0);
      const defaultEnd = new Date(defaultStart);
      defaultEnd.setHours(10, 0, 0, 0);

      setFormData(prev => ({
        ...prev,
        startDate: defaultStart.toISOString().split('T')[0],
        startTime: defaultStart.toTimeString().slice(0, 5),
        endDate: defaultEnd.toISOString().split('T')[0],
        endTime: defaultEnd.toTimeString().slice(0, 5)
      }));
    }
  }, [booking]);

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

  const handleResidentChange = (e) => {
    const residentId = e.target.value;
    const selectedResident = residents.find(r => r.id === residentId);
    
    setFormData(prev => ({
      ...prev,
      residentId,
      contactInfo: selectedResident ? {
        name: selectedResident.name,
        phone: selectedResident.phone,
        email: selectedResident.email
      } : {
        name: '',
        phone: '',
        email: ''
      }
    }));
  };

  const handleAmenityChange = (e) => {
    const amenityId = e.target.value;
    const selectedAmenity = amenities.find(a => a.id === amenityId);
    
    setFormData(prev => ({
      ...prev,
      amenityId,
      title: selectedAmenity ? `${selectedAmenity.name} Booking` : ''
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.amenityId) {
      newErrors.amenityId = 'Please select an amenity';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    if (!formData.contactInfo.name.trim()) {
      newErrors['contactInfo.name'] = 'Contact name is required';
    }

    if (!formData.contactInfo.phone.trim()) {
      newErrors['contactInfo.phone'] = 'Contact phone is required';
    }

    // Validate date/time logic
    if (formData.startDate && formData.startTime && formData.endDate && formData.endTime) {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
      
      if (endDateTime <= startDateTime) {
        newErrors.endTime = 'End time must be after start time';
      }

      // Check if booking is in the past
      if (startDateTime < new Date()) {
        newErrors.startDate = 'Booking cannot be in the past';
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
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

      const bookingData = {
        title: formData.title.trim(),
        amenityId: formData.amenityId,
        residentId: formData.residentId || null,
        startDate: startDateTime,
        endDate: endDateTime,
        notes: formData.notes.trim(),
        contactInfo: {
          name: formData.contactInfo.name.trim(),
          phone: formData.contactInfo.phone.trim(),
          email: formData.contactInfo.email.trim()
        },
        status: formData.status
      };

      await onSubmit(bookingData);
    } catch (error) {
      console.error('Error submitting booking:', error);
      setErrors({ general: 'Failed to save booking. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const getAmenityOptions = () => {
    return amenities.map(amenity => (
      <option key={amenity.id} value={amenity.id}>
        {amenity.name}
      </option>
    ));
  };

  const getResidentOptions = () => {
    return residents.map(resident => (
      <option key={resident.id} value={resident.id}>
        {resident.name} - Unit {resident.unitNumber}
      </option>
    ));
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="booking-form-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {booking ? 'Edit Booking' : 'New Booking'}
          </h2>
          <button className="close-button" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none">
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="booking-form">
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
            <h3 className="section-title">Booking Details</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="amenityId" className="form-label">
                  Amenity/Facility *
                </label>
                <select
                  id="amenityId"
                  name="amenityId"
                  value={formData.amenityId}
                  onChange={handleAmenityChange}
                  className={`form-select ${errors.amenityId ? 'error' : ''}`}
                  required
                >
                  <option value="">Select an amenity</option>
                  {getAmenityOptions()}
                </select>
                {errors.amenityId && (
                  <span className="error-message">{errors.amenityId}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="title" className="form-label">
                  Booking Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`form-input ${errors.title ? 'error' : ''}`}
                  placeholder="e.g., Birthday Party, Corporate Event"
                  required
                />
                {errors.title && (
                  <span className="error-message">{errors.title}</span>
                )}
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="startDate" className="form-label">
                  Start Date *
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className={`form-input ${errors.startDate ? 'error' : ''}`}
                  required
                />
                {errors.startDate && (
                  <span className="error-message">{errors.startDate}</span>
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
                <label htmlFor="endDate" className="form-label">
                  End Date *
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className={`form-input ${errors.endDate ? 'error' : ''}`}
                  required
                />
                {errors.endDate && (
                  <span className="error-message">{errors.endDate}</span>
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
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Contact Information</h3>
            
            <div className="form-group">
              <label htmlFor="residentId" className="form-label">
                Select Resident (Optional)
              </label>
              <select
                id="residentId"
                name="residentId"
                value={formData.residentId}
                onChange={handleResidentChange}
                className="form-select"
              >
                <option value="">Select resident or enter custom contact</option>
                {getResidentOptions()}
              </select>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="contactName" className="form-label">
                  Contact Name *
                </label>
                <input
                  type="text"
                  id="contactName"
                  name="contactInfo.name"
                  value={formData.contactInfo.name}
                  onChange={handleInputChange}
                  className={`form-input ${errors['contactInfo.name'] ? 'error' : ''}`}
                  placeholder="Full name"
                  required
                />
                {errors['contactInfo.name'] && (
                  <span className="error-message">{errors['contactInfo.name']}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="contactPhone" className="form-label">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  id="contactPhone"
                  name="contactInfo.phone"
                  value={formData.contactInfo.phone}
                  onChange={handleInputChange}
                  className={`form-input ${errors['contactInfo.phone'] ? 'error' : ''}`}
                  placeholder="+1 (555) 123-4567"
                  required
                />
                {errors['contactInfo.phone'] && (
                  <span className="error-message">{errors['contactInfo.phone']}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="contactEmail" className="form-label">
                  Contact Email
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactInfo.email"
                  value={formData.contactInfo.email}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="email@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="status" className="form-label">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
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
                placeholder="Any special requirements, setup notes, or additional information..."
                rows={4}
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
                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="17,21 17,13 7,13 7,21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="7,3 7,8 15,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {booking ? 'Update Booking' : 'Create Booking'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;