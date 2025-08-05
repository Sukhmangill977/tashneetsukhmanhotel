// components/VisitorForm.js
import React, { useState, useEffect } from 'react';
import './VisitorForm.css';

const VisitorForm = ({ visitor, guests, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    visiting: {
      guestId: '',
      guestName: '',
      roomNumber: ''
    },
    purpose: '',
    expectedArrival: '',
    expectedArrivalTime: '',
    expectedDeparture: '',
    expectedDepartureTime: '',
    parkingRequired: false,
    vehicleInfo: {
      make: '',
      model: '',
      year: '',
      color: '',
      licensePlate: ''
    },
    accessCode: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visitor) {
      // Edit mode - populate form with existing visitor data
      const arrivalDate = visitor.expectedArrival.toDate ? visitor.expectedArrival.toDate() : new Date(visitor.expectedArrival);
      const departureDate = visitor.expectedDeparture ? 
        (visitor.expectedDeparture.toDate ? visitor.expectedDeparture.toDate() : new Date(visitor.expectedDeparture)) : 
        null;
      
      setFormData({
        name: visitor.name || '',
        phone: visitor.phone || '',
        email: visitor.email || '',
        visiting: {
          guestId: visitor.visiting?.guestId || '',
          guestName: visitor.visiting?.guestName || '',
          roomNumber: visitor.visiting?.roomNumber || ''
        },
        purpose: visitor.purpose || '',
        expectedArrival: arrivalDate.toISOString().split('T')[0],
        expectedArrivalTime: arrivalDate.toTimeString().slice(0, 5),
        expectedDeparture: departureDate ? departureDate.toISOString().split('T')[0] : '',
        expectedDepartureTime: departureDate ? departureDate.toTimeString().slice(0, 5) : '',
        parkingRequired: !!visitor.parkingSpot,
        vehicleInfo: visitor.vehicleInfo || {
          make: '',
          model: '',
          year: '',
          color: '',
          licensePlate: ''
        },
        accessCode: visitor.accessCode || '',
        notes: visitor.notes || ''
      });
    } else {
      // Create mode - set default values
      const now = new Date();
      const defaultArrival = new Date(now);
      defaultArrival.setHours(now.getHours() + 1, 0, 0, 0);
      const defaultDeparture = new Date(defaultArrival);
      defaultDeparture.setHours(defaultArrival.getHours() + 2);

      setFormData(prev => ({
        ...prev,
        expectedArrival: defaultArrival.toISOString().split('T')[0],
        expectedArrivalTime: defaultArrival.toTimeString().slice(0, 5),
        expectedDeparture: defaultDeparture.toISOString().split('T')[0],
        expectedDepartureTime: defaultDeparture.toTimeString().slice(0, 5),
        accessCode: generateAccessCode()
      }));
    }
  }, [visitor]);

  const generateAccessCode = () => {
    return 'VIS' + Math.random().toString(36).substr(2, 4).toUpperCase();
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
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
        [name]: type === 'checkbox' ? checked : value
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

    if (!formData.name.trim()) {
      newErrors.name = 'Visitor name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.visiting.guestName.trim()) {
      newErrors['visiting.guestName'] = 'guest name is required';
    }

    if (!formData.visiting.roomNumber.trim()) {
      newErrors['visiting.roomNumber'] = 'Unit number is required';
    }

    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Purpose of visit is required';
    }

    if (!formData.expectedArrival) {
      newErrors.expectedArrival = 'Expected arrival date is required';
    }

    if (!formData.expectedArrivalTime) {
      newErrors.expectedArrivalTime = 'Expected arrival time is required';
    }

    // Validate email if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate date/time logic
    if (formData.expectedArrival && formData.expectedArrivalTime && 
        formData.expectedDeparture && formData.expectedDepartureTime) {
      const arrivalDateTime = new Date(`${formData.expectedArrival}T${formData.expectedArrivalTime}`);
      const departureDateTime = new Date(`${formData.expectedDeparture}T${formData.expectedDepartureTime}`);
      
      if (departureDateTime <= arrivalDateTime) {
        newErrors.expectedDepartureTime = 'Departure time must be after arrival time';
      }
    }

    // Validate parking info if parking is required
    if (formData.parkingRequired) {
      if (!formData.vehicleInfo.licensePlate.trim()) {
        newErrors['vehicleInfo.licensePlate'] = 'License plate is required when parking is needed';
      }
      if (!formData.vehicleInfo.make.trim()) {
        newErrors['vehicleInfo.make'] = 'Vehicle make is required when parking is needed';
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
      const arrivalDateTime = new Date(`${formData.expectedArrival}T${formData.expectedArrivalTime}`);
      const departureDateTime = formData.expectedDeparture && formData.expectedDepartureTime ? 
        new Date(`${formData.expectedDeparture}T${formData.expectedDepartureTime}`) : null;

      const visitorData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        visiting: {
          guestId: formData.visiting.guestId || null,
          guestName: formData.visiting.guestName.trim(),
          roomNumber: formData.visiting.roomNumber.trim()
        },
        purpose: formData.purpose.trim(),
        expectedArrival: arrivalDateTime,
        expectedDeparture: departureDateTime,
        vehicleInfo: formData.parkingRequired ? {
          make: formData.vehicleInfo.make.trim(),
          model: formData.vehicleInfo.model.trim(),
          year: formData.vehicleInfo.year.trim(),
          color: formData.vehicleInfo.color.trim(),
          licensePlate: formData.vehicleInfo.licensePlate.trim()
        } : null,
        parkingRequired: formData.parkingRequired,
        accessCode: formData.accessCode.trim(),
        notes: formData.notes.trim(),
        notificationSent: false,
        badgePrinted: false
      };

      await onSubmit(visitorData);
    } catch (error) {
      console.error('Error submitting visitor form:', error);
      setErrors({ general: 'Failed to save visitor. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const purposeOptions = [
    'Personal Visit',
    'Business Meeting',
    'Delivery',
    'Maintenance/Repair',
    'Medical Visit',
    'Real Estate Viewing',
    'Moving/Relocation',
    'Party/Event',
    'Other'
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="visitor-form-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {visitor ? 'Edit Visitor' : 'Register New Visitor'}
          </h2>
          <button className="close-button" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none">
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="visitor-form">
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
            <h3 className="section-title">Visitor Information</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Visitor Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  placeholder="Full name"
                  required
                />
                {errors.name && (
                  <span className="error-message">{errors.name}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`form-input ${errors.phone ? 'error' : ''}`}
                  placeholder="+1 (555) 123-4567"
                  required
                />
                {errors.phone && (
                  <span className="error-message">{errors.phone}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="visitor@email.com"
                />
                {errors.email && (
                  <span className="error-message">{errors.email}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="purpose" className="form-label">
                  Purpose of Visit *
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
            <h3 className="section-title">Visit Schedule</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="expectedArrival" className="form-label">
                  Expected Arrival Date *
                </label>
                <input
                  type="date"
                  id="expectedArrival"
                  name="expectedArrival"
                  value={formData.expectedArrival}
                  onChange={handleInputChange}
                  className={`form-input ${errors.expectedArrival ? 'error' : ''}`}
                  required
                />
                {errors.expectedArrival && (
                  <span className="error-message">{errors.expectedArrival}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="expectedArrivalTime" className="form-label">
                  Expected Arrival Time *
                </label>
                <input
                  type="time"
                  id="expectedArrivalTime"
                  name="expectedArrivalTime"
                  value={formData.expectedArrivalTime}
                  onChange={handleInputChange}
                  className={`form-input ${errors.expectedArrivalTime ? 'error' : ''}`}
                  required
                />
                {errors.expectedArrivalTime && (
                  <span className="error-message">{errors.expectedArrivalTime}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="expectedDeparture" className="form-label">
                  Expected Departure Date
                </label>
                <input
                  type="date"
                  id="expectedDeparture"
                  name="expectedDeparture"
                  value={formData.expectedDeparture}
                  onChange={handleInputChange}
                  className={`form-input ${errors.expectedDeparture ? 'error' : ''}`}
                />
                {errors.expectedDeparture && (
                  <span className="error-message">{errors.expectedDeparture}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="expectedDepartureTime" className="form-label">
                  Expected Departure Time
                </label>
                <input
                  type="time"
                  id="expectedDepartureTime"
                  name="expectedDepartureTime"
                  value={formData.expectedDepartureTime}
                  onChange={handleInputChange}
                  className={`form-input ${errors.expectedDepartureTime ? 'error' : ''}`}
                />
                {errors.expectedDepartureTime && (
                  <span className="error-message">{errors.expectedDepartureTime}</span>
                )}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">parking & Vehicle Information</h3>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="parkingRequired"
                  checked={formData.parkingRequired}
                  onChange={handleInputChange}
                  className="form-checkbox"
                />
                <span className="checkbox-text">parking required</span>
              </label>
            </div>

            {formData.parkingRequired && (
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
                    required={formData.parkingRequired}
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
                    required={formData.parkingRequired}
                  />
                  {errors['vehicleInfo.licensePlate'] && (
                    <span className="error-message">{errors['vehicleInfo.licensePlate']}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="form-section">
            <h3 className="section-title">Access & Additional Information</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="accessCode" className="form-label">
                  Access Code
                </label>
                <input
                  type="text"
                  id="accessCode"
                  name="accessCode"
                  value={formData.accessCode}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="VIS1234"
                />
                <small className="field-hint">
                  Auto-generated code for visitor access
                </small>
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
                placeholder="Any special instructions, accessibility needs, or other notes..."
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
                    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                    <polyline points="17,11 19,13 23,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {visitor ? 'Update Visitor' : 'Register Visitor'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VisitorForm;