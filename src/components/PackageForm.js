// components/PackageForm.js
import React, { useState, useEffect } from 'react';
import './PackageForm.css';

const PackageForm = ({ package: pkg, guests, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    guestId: '',
    guestName: '',
    roomNumber: '',
    recipientEmail: '',
    recipientPhone: '',
    courier: '',
    trackingNumber: '',
    packageType: 'Box',
    size: 'Medium',
    description: '',
    deliveredAt: '',
    deliveredTime: '',
    receivedBy: 'Front Desk',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pkg) {
      // Edit mode - populate form with existing package data
      const deliveredDate = pkg.deliveredAt;
      const dateStr = deliveredDate.toISOString().split('T')[0];
      const timeStr = deliveredDate.toTimeString().slice(0, 5);
      
      setFormData({
        guestId: pkg.guestId || '',
        guestName: pkg.guestName || '',
        roomNumber: pkg.roomNumber || '',
        recipientEmail: pkg.recipientEmail || '',
        recipientPhone: pkg.recipientPhone || '',
        courier: pkg.courier || '',
        trackingNumber: pkg.trackingNumber || '',
        packageType: pkg.packageType || 'Box',
        size: pkg.size || 'Medium',
        description: pkg.description || '',
        deliveredAt: dateStr,
        deliveredTime: timeStr,
        receivedBy: pkg.receivedBy || 'Front Desk',
        notes: pkg.notes || ''
      });
    } else {
      // Create mode - set default values
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().slice(0, 5);

      setFormData(prev => ({
        ...prev,
        deliveredAt: dateStr,
        deliveredTime: timeStr
      }));
    }
  }, [pkg]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

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
        guestId,
        guestName: selectedguest.name,
        roomNumber: selectedguest.roomNumber,
        recipientEmail: selectedguest.email,
        recipientPhone: selectedguest.phone
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        guestId: '',
        guestName: '',
        roomNumber: '',
        recipientEmail: '',
        recipientPhone: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.guestName.trim()) {
      newErrors.guestName = 'Recipient name is required';
    }

    if (!formData.roomNumber.trim()) {
      newErrors.roomNumber = 'Unit number is required';
    }

    if (!formData.recipientEmail.trim()) {
      newErrors.recipientEmail = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.recipientEmail)) {
      newErrors.recipientEmail = 'Please enter a valid email address';
    }

    if (!formData.recipientPhone.trim()) {
      newErrors.recipientPhone = 'Phone number is required';
    }

    if (!formData.courier.trim()) {
      newErrors.courier = 'Courier is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Package description is required';
    }

    if (!formData.deliveredAt) {
      newErrors.deliveredAt = 'Delivery date is required';
    }

    if (!formData.deliveredTime) {
      newErrors.deliveredTime = 'Delivery time is required';
    }

    // Validate delivery date/time is not in the future
    if (formData.deliveredAt && formData.deliveredTime) {
      const deliveryDateTime = new Date(`${formData.deliveredAt}T${formData.deliveredTime}`);
      if (deliveryDateTime > new Date()) {
        newErrors.deliveredAt = 'Delivery time cannot be in the future';
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
      const deliveryDateTime = new Date(`${formData.deliveredAt}T${formData.deliveredTime}`);

      const packageData = {
        guestId: formData.guestId || null,
        guestName: formData.guestName.trim(),
        roomNumber: formData.roomNumber.trim(),
        recipientEmail: formData.recipientEmail.trim().toLowerCase(),
        recipientPhone: formData.recipientPhone.trim(),
        courier: formData.courier.trim(),
        trackingNumber: formData.trackingNumber.trim(),
        packageType: formData.packageType,
        size: formData.size,
        description: formData.description.trim(),
        deliveredAt: deliveryDateTime,
        receivedBy: formData.receivedBy.trim(),
        notes: formData.notes.trim()
      };

      await onSubmit(packageData);
    } catch (error) {
      console.error('Error submitting package form:', error);
      setErrors({ general: 'Failed to save package. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const courierOptions = [
    'UPS', 'FedEx', 'DHL', 'Amazon', 'Canada Post', 'Purolator', 
    'Other Courier', 'Personal Delivery', 'Unknown'
  ];

  const packageTypes = [
    'Box', 'Envelope', 'Tube', 'Bag', 'Pallet', 'Other'
  ];

  const packageSizes = [
    'Small', 'Medium', 'Large', 'Extra Large'
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="package-form-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {pkg ? 'Edit Package' : 'Register New Package'}
          </h2>
          <button className="close-button" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none">
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="package-form">
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
            <h3 className="section-title">Recipient Information</h3>
            
            <div className="form-group">
              <label htmlFor="guestId" className="form-label">
                Select guest (Optional)
              </label>
              <select
                id="guestId"
                name="guestId"
                value={formData.guestId}
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
                  Recipient Name *
                </label>
                <input
                  type="text"
                  id="guestName"
                  name="guestName"
                  value={formData.guestName}
                  onChange={handleInputChange}
                  className={`form-input ${errors.guestName ? 'error' : ''}`}
                  placeholder="Full name"
                  required
                />
                {errors.guestName && (
                  <span className="error-message">{errors.guestName}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="roomNumber" className="form-label">
                  Unit Number *
                </label>
                <input
                  type="text"
                  id="roomNumber"
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleInputChange}
                  className={`form-input ${errors.roomNumber ? 'error' : ''}`}
                  placeholder="e.g., 101, 2A"
                  required
                />
                {errors.roomNumber && (
                  <span className="error-message">{errors.roomNumber}</span>
                )}
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="recipientEmail" className="form-label">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="recipientEmail"
                  name="recipientEmail"
                  value={formData.recipientEmail}
                  onChange={handleInputChange}
                  className={`form-input ${errors.recipientEmail ? 'error' : ''}`}
                  placeholder="recipient@email.com"
                  required
                />
                {errors.recipientEmail && (
                  <span className="error-message">{errors.recipientEmail}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="recipientPhone" className="form-label">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="recipientPhone"
                  name="recipientPhone"
                  value={formData.recipientPhone}
                  onChange={handleInputChange}
                  className={`form-input ${errors.recipientPhone ? 'error' : ''}`}
                  placeholder="+1 (555) 123-4567"
                  required
                />
                {errors.recipientPhone && (
                  <span className="error-message">{errors.recipientPhone}</span>
                )}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Package Details</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="courier" className="form-label">
                  Courier *
                </label>
                <select
                  id="courier"
                  name="courier"
                  value={formData.courier}
                  onChange={handleInputChange}
                  className={`form-select ${errors.courier ? 'error' : ''}`}
                  required
                >
                  <option value="">Select courier</option>
                  {courierOptions.map(courier => (
                    <option key={courier} value={courier}>
                      {courier}
                    </option>
                  ))}
                </select>
                {errors.courier && (
                  <span className="error-message">{errors.courier}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="trackingNumber" className="form-label">
                  Tracking Number
                </label>
                <input
                  type="text"
                  id="trackingNumber"
                  name="trackingNumber"
                  value={formData.trackingNumber}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="1Z999AA1234567890"
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="packageType" className="form-label">
                  Package Type
                </label>
                <select
                  id="packageType"
                  name="packageType"
                  value={formData.packageType}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  {packageTypes.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="size" className="form-label">
                  Size
                </label>
                <select
                  id="size"
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  {packageSizes.map(size => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description" className="form-label">
                Package Description *
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={`form-input ${errors.description ? 'error' : ''}`}
                placeholder="e.g., Amazon Package, Legal Documents, Flowers"
                required
              />
              {errors.description && (
                <span className="error-message">{errors.description}</span>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Delivery Information</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="deliveredAt" className="form-label">
                  Delivery Date *
                </label>
                <input
                  type="date"
                  id="deliveredAt"
                  name="deliveredAt"
                  value={formData.deliveredAt}
                  onChange={handleInputChange}
                  className={`form-input ${errors.deliveredAt ? 'error' : ''}`}
                  required
                />
                {errors.deliveredAt && (
                  <span className="error-message">{errors.deliveredAt}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="deliveredTime" className="form-label">
                  Delivery Time *
                </label>
                <input
                  type="time"
                  id="deliveredTime"
                  name="deliveredTime"
                  value={formData.deliveredTime}
                  onChange={handleInputChange}
                  className={`form-input ${errors.deliveredTime ? 'error' : ''}`}
                  required
                />
                {errors.deliveredTime && (
                  <span className="error-message">{errors.deliveredTime}</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="receivedBy" className="form-label">
                Received By
              </label>
              <input
                type="text"
                id="receivedBy"
                name="receivedBy"
                value={formData.receivedBy}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Who received the package"
              />
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
                placeholder="Any special handling instructions, condition notes, or other details..."
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
                    <path d="M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16V8z" stroke="currentColor" strokeWidth="2"/>
                    <polyline points="3.27,6.96 12,12.01 20.73,6.96" stroke="currentColor" strokeWidth="2"/>
                    <line x1="12" y1="22.08" x2="12" y2="12" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  {pkg ? 'Update Package' : 'Register Package'}
                </>
              )}
            </button>
          </div>
        </form>
        </div>
    </div>
  );
};

export default PackageForm;