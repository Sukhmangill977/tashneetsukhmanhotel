// components/ContactSelector.js
import React, { useState, useEffect } from 'react';
import './ContactSelector.css';

const ContactSelector = ({ isOpen, onClose, residents = [], onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredResidents, setFilteredResidents] = useState([]);
  const [selectedResident, setSelectedResident] = useState(null);

  useEffect(() => {
    filterResidents();
  }, [residents, searchTerm]);

  const filterResidents = () => {
    if (!searchTerm.trim()) {
      setFilteredResidents(residents);
      return;
    }

    const filtered = residents.filter(resident => {
      const searchLower = searchTerm.toLowerCase();
      return (
        resident.name.toLowerCase().includes(searchLower) ||
        resident.unitNumber.toLowerCase().includes(searchLower) ||
        resident.phone.toLowerCase().includes(searchLower) ||
        resident.email.toLowerCase().includes(searchLower)
      );
    });

    setFilteredResidents(filtered);
  };

  const handleSelect = (resident) => {
    setSelectedResident(resident);
  };

  const handleConfirm = () => {
    if (selectedResident) {
      onSelect(selectedResident);
    }
  };

  const formatPhone = (phone) => {
    // Format phone number for better display
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  if (!isOpen) return null;

  return (
    <div className="contact-selector-overlay">
      <div className="contact-selector-modal">
        <div className="selector-header">
          <h3 className="selector-title">Select Recipient</h3>
          <button className="close-btn" onClick={onClose}>
            <span>✕</span>
          </button>
        </div>

        <div className="selector-content">
          {/* Search Bar */}
          <div className="search-section">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by name, unit, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                autoFocus
              />
              <span className="search-icon">🔍</span>
            </div>
          </div>

          {/* Residents List */}
          <div className="residents-list">
            {filteredResidents.length === 0 ? (
              <div className="empty-results">
                <div className="empty-icon">👤</div>
                <h4>No residents found</h4>
                <p>Try adjusting your search terms</p>
              </div>
            ) : (
              filteredResidents.map((resident) => (
                <div
                  key={resident.id}
                  className={`resident-item ${selectedResident?.id === resident.id ? 'selected' : ''}`}
                  onClick={() => handleSelect(resident)}
                >
                  <div className="resident-avatar">
                    {resident.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="resident-info">
                    <div className="resident-name">{resident.name}</div>
                    <div className="resident-details">
                      <span className="unit-number">Unit {resident.unitNumber}</span>
                      <span className="phone-number">{formatPhone(resident.phone)}</span>
                    </div>
                    <div className="resident-email">{resident.email}</div>
                  </div>
                  <div className="selection-indicator">
                    {selectedResident?.id === resident.id && (
                      <span className="checkmark">✓</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="selector-actions">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="confirm-btn" 
            onClick={handleConfirm}
            disabled={!selectedResident}
          >
            <span className="btn-icon">✓</span>
            Select Contact
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactSelector;