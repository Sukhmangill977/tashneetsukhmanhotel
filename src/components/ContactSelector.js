// components/ContactSelector.js
import React, { useState, useEffect } from 'react';
import './ContactSelector.css';

const ContactSelector = ({ isOpen, onClose, guests = [], onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredguests, setFilteredguests] = useState([]);
  const [selectedguest, setSelectedguest] = useState(null);

  useEffect(() => {
    filterguests();
  }, [guests, searchTerm]);

  const filterguests = () => {
    if (!searchTerm.trim()) {
      setFilteredguests(guests);
      return;
    }

    const filtered = guests.filter(guest => {
      const searchLower = searchTerm.toLowerCase();
      return (
        guest.name.toLowerCase().includes(searchLower) ||
        guest.roomNumber.toLowerCase().includes(searchLower) ||
        guest.phone.toLowerCase().includes(searchLower) ||
        guest.email.toLowerCase().includes(searchLower)
      );
    });

    setFilteredguests(filtered);
  };

  const handleSelect = (guest) => {
    setSelectedguest(guest);
  };

  const handleConfirm = () => {
    if (selectedguest) {
      onSelect(selectedguest);
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

          {/* guests List */}
          <div className="guests-list">
            {filteredguests.length === 0 ? (
              <div className="empty-results">
                <div className="empty-icon">👤</div>
                <h4>No guests found</h4>
                <p>Try adjusting your search terms</p>
              </div>
            ) : (
              filteredguests.map((guest) => (
                <div
                  key={guest.id}
                  className={`guest-item ${selectedguest?.id === guest.id ? 'selected' : ''}`}
                  onClick={() => handleSelect(guest)}
                >
                  <div className="guest-avatar">
                    {guest.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="guest-info">
                    <div className="guest-name">{guest.name}</div>
                    <div className="guest-details">
                      <span className="unit-number">Unit {guest.roomNumber}</span>
                      <span className="phone-number">{formatPhone(guest.phone)}</span>
                    </div>
                    <div className="guest-email">{guest.email}</div>
                  </div>
                  <div className="selection-indicator">
                    {selectedguest?.id === guest.id && (
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
            disabled={!selectedguest}
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