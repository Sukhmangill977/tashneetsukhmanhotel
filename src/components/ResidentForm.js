// components/ResidentForm.js
import React, { useState, useEffect } from 'react';
import './ResidentForm.css';

const ResidentForm = ({ resident, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    unitNumber: '',
    email: '',
    phone: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (resident) {
      // Edit mode - populate form with existing resident data
      setFormData({
        name: resident.name || '',
        unitNumber: resident.unitNumber || '',
        email: resident.email || '',
        phone: resident.phone || '',
        emergencyContact: {
          name: resident.emergencyContact?.name || '',
          phone: resident.emergencyContact?.phone || '',
          relationship: resident.emergencyContact?.relationship || ''
        },
        notes: resident.notes || ''
      });
    } else {
      // Create mode - reset form
      setFormData({
        name: '',
        unitNumber: '',
        email: '',
        phone: '',
        emergencyContact: {
          name: '',
          phone: '',
          relationship: ''
        },
        notes: ''
      });
    }
  }, [resident]);

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

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.unitNumber.trim()) {
      newErrors.unitNumber = 'Unit number is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Emergency contact validation (optional but if provided, should be complete)
    if (formData.emergencyContact.name || formData.emergencyContact.phone || formData.emergencyContact.relationship) {
      if (!formData.emergencyContact.name.trim()) {
        newErrors['emergencyContact.name'] = 'Emergency contact name is required';
      }
      if (!formData.emergencyContact.phone.trim()) {
        newErrors['emergencyContact.phone'] = 'Emergency contact phone is required';
      }
      if (!formData.emergencyContact.relationship.trim()) {
        newErrors['emergencyContact.relationship'] = 'Relationship is required';
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
      const residentData = {
        name: formData.name.trim(),
        unitNumber: formData.unitNumber.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        emergencyContact: {
          name: formData.emergencyContact.name.trim(),
          phone: formData.emergencyContact.phone.trim(),
          relationship: formData.emergencyContact.relationship.trim()
        },
        notes: formData.notes.trim()
      };

      // Remove empty emergency contact if not provided
      if (!residentData.emergencyContact.name && !residentData.emergencyContact.phone) {
        residentData.emergencyContact = null;
      }

      await onSubmit(residentData);
    } catch (error) {
      console.error('Error submitting resident form:', error);
      setErrors({ general: 'Failed to save resident. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="resident-form-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {resident ? 'Edit Resident' : 'Add New Resident'}
          </h2>
          <button className="close-button" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none">
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="resident-form">
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
            <h3 className="section-title">Basic Information</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  placeholder="Enter full name"
                  required
                />
                {errors.name && (
                  <span className="error-message">{errors.name}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="unitNumber" className="form-label">
                  Unit Number *
                </label>
                <input
                  type="text"
                  id="unitNumber"
                  name="unitNumber"
                  value={formData.unitNumber}
                  onChange={handleInputChange}
                  className={`form-input ${errors.unitNumber ? 'error' : ''}`}
                  placeholder="e.g., 101, 2A, PH1"
                  required
                />
                {errors.unitNumber && (
                  <span className="error-message">{errors.unitNumber}</span>
                )}
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="resident@email.com"
                  required
                />
                {errors.email && (
                  <span className="error-message">{errors.email}</span>
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
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Emergency Contact</h3>
            <p className="section-description">
              Optional but recommended for emergency situations
            </p>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="emergencyName" className="form-label">
                  Contact Name
                </label>
                <input
                  type="text"
                  id="emergencyName"
                  name="emergencyContact.name"
                  value={formData.emergencyContact.name}
                  onChange={handleInputChange}
                  className={`form-input ${errors['emergencyContact.name'] ? 'error' : ''}`}
                  placeholder="Full name"
                />
                {errors['emergencyContact.name'] && (
                  <span className="error-message">{errors['emergencyContact.name']}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="emergencyPhone" className="form-label">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  id="emergencyPhone"
                  name="emergencyContact.phone"
                  value={formData.emergencyContact.phone}
                  onChange={handleInputChange}
                  className={`form-input ${errors['emergencyContact.phone'] ? 'error' : ''}`}
                  placeholder="+1 (555) 123-4567"
                />
                {errors['emergencyContact.phone'] && (
                  <span className="error-message">{errors['emergencyContact.phone']}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="relationship" className="form-label">
                  Relationship
                </label>
                <select
                  id="relationship"
                  name="emergencyContact.relationship"
                  value={formData.emergencyContact.relationship}
                  onChange={handleInputChange}
                  className={`form-select ${errors['emergencyContact.relationship'] ? 'error' : ''}`}
                >
                  <option value="">Select relationship</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Partner">Partner</option>
                  <option value="Parent">Parent</option>
                  <option value="Child">Child</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Friend">Friend</option>
                  <option value="Other">Other</option>
                </select>
                {errors['emergencyContact.relationship'] && (
                  <span className="error-message">{errors['emergencyContact.relationship']}</span>
                )}
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
                placeholder="Any additional information about the resident, special instructions, accessibility needs, etc."
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
                  {resident ? 'Update Resident' : 'Add Resident'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResidentForm;