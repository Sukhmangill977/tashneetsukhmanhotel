// components/MessageTemplateModal.js
import React, { useState } from 'react';
import './MessageTemplateModal.css';

const MessageTemplateModal = ({ isOpen, onClose, onSelectTemplate }) => {
  const [activeTab, setActiveTab] = useState('predefined');
  const [customTemplates, setCustomTemplates] = useState([
    {
      id: 'custom_1',
      name: 'Weekly Newsletter',
      content: 'Hello residents! Here\'s your weekly building update: [CONTENT]. Have a great week!',
      category: 'newsletter',
      createdAt: new Date('2024-01-15')
    },
    {
      id: 'custom_2',
      name: 'Noise Complaint Follow-up',
      content: 'Thank you for reporting the noise issue. We have addressed this with the resident and will monitor the situation.',
      category: 'complaint',
      createdAt: new Date('2024-01-10')
    }
  ]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: '',
    category: 'general'
  });

  // Predefined templates organized by category
  const predefinedTemplates = {
    delivery: [
      {
        id: 'package_arrival',
        name: 'Package Delivery',
        content: 'Hi! A package has arrived for your unit. Please visit the front desk to collect it during business hours. Thank you!'
      },
      {
        id: 'package_pickup_reminder',
        name: 'Package Pickup Reminder',
        content: 'Reminder: You have a package waiting at the front desk. Please pick it up within 7 days. Thank you!'
      },
      {
        id: 'large_delivery',
        name: 'Large Item Delivery',
        content: 'A large delivery has arrived for your unit. Please contact the front desk to arrange pickup or delivery to your unit.'
      }
    ],
    maintenance: [
      {
        id: 'maintenance_notice',
        name: 'Maintenance Notice',
        content: 'Notice: Scheduled maintenance will occur in your building on [DATE] from [TIME]. Please plan accordingly. Contact us with any questions.'
      },
      {
        id: 'emergency_maintenance',
        name: 'Emergency Maintenance',
        content: 'URGENT: Emergency maintenance is being performed in your area. Please follow any instructions from building staff. Updates will follow.'
      },
      {
        id: 'maintenance_complete',
        name: 'Maintenance Complete',
        content: 'The maintenance work in your area has been completed. Thank you for your patience during this time.'
      }
    ],
    visitor: [
      {
        id: 'visitor_approved',
        name: 'Visitor Approved',
        content: 'Your visitor has been approved and registered. They can access the building using the provided access code. Thank you!'
      },
      {
        id: 'visitor_waiting',
        name: 'Visitor Waiting',
        content: 'You have a visitor waiting in the lobby. Please come down to meet them or provide authorization for building access.'
      },
      {
        id: 'parking_approved',
        name: 'Visitor Parking Approved',
        content: 'Your visitor parking request has been approved. Parking spot: [SPOT]. Access code: [CODE]. Valid until [TIME].'
      }
    ],
    booking: [
      {
        id: 'booking_confirmed',
        name: 'Amenity Booking Confirmed',
        content: 'Your amenity booking has been confirmed for [DATE] at [TIME]. Please arrive on time and follow all facility guidelines.'
      },
      {
        id: 'booking_reminder',
        name: 'Booking Reminder',
        content: 'Reminder: You have an amenity booking tomorrow at [TIME]. Please bring your key fob and follow all facility rules.'
      },
      {
        id: 'booking_cancelled',
        name: 'Booking Cancelled',
        content: 'Your booking for [DATE] has been cancelled as requested. Any applicable refunds will be processed within 3-5 business days.'
      }
    ],
    general: [
      {
        id: 'payment_reminder',
        name: 'Payment Reminder',
        content: 'Friendly reminder: Your monthly payment is due soon. Please contact the office if you have any questions.'
      },
      {
        id: 'emergency_notice',
        name: 'Emergency Notice',
        content: 'URGENT: [EMERGENCY DETAILS]. Please follow emergency procedures and contact building management if needed.'
      },
      {
        id: 'building_update',
        name: 'Building Update',
        content: 'Important update for all residents: [UPDATE DETAILS]. Please contact the office if you have any questions.'
      }
    ]
  };

  const handleCreateTemplate = () => {
    if (!newTemplate.name.trim() || !newTemplate.content.trim()) {
      alert('Please fill in all fields');
      return;
    }

    const template = {
      id: `custom_${Date.now()}`,
      name: newTemplate.name.trim(),
      content: newTemplate.content.trim(),
      category: newTemplate.category,
      createdAt: new Date()
    };

    setCustomTemplates(prev => [template, ...prev]);
    setNewTemplate({ name: '', content: '', category: 'general' });
    setShowCreateForm(false);
  };

  const handleDeleteTemplate = (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      setCustomTemplates(prev => prev.filter(t => t.id !== templateId));
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderPredefinedTemplates = () => (
    <div className="templates-content">
      {Object.entries(predefinedTemplates).map(([category, templates]) => (
        <div key={category} className="template-category">
          <h4 className="category-title">
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </h4>
          <div className="templates-grid">
            {templates.map((template) => (
              <div key={template.id} className="template-card">
                <div className="template-header">
                  <h5 className="template-name">{template.name}</h5>
                </div>
                <div className="template-preview">
                  {template.content}
                </div>
                <div className="template-actions">
                  <button 
                    className="use-template-btn"
                    onClick={() => onSelectTemplate(template)}
                  >
                    Use Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderCustomTemplates = () => (
    <div className="templates-content">
      <div className="custom-header">
        <h4 className="section-title">Your Custom Templates</h4>
        <button 
          className="create-template-btn"
          onClick={() => setShowCreateForm(true)}
        >
          <span className="btn-icon">+</span>
          Create Template
        </button>
      </div>

      {showCreateForm && (
        <div className="create-template-form">
          <div className="form-header">
            <h5>Create New Template</h5>
            <button 
              className="cancel-create-btn"
              onClick={() => setShowCreateForm(false)}
            >
              ✕
            </button>
          </div>
          
          <div className="form-field">
            <label>Template Name</label>
            <input
              type="text"
              value={newTemplate.name}
              onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter template name..."
              maxLength={50}
            />
          </div>
          
          <div className="form-field">
            <label>Category</label>
            <select
              value={newTemplate.category}
              onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
            >
              <option value="general">General</option>
              <option value="delivery">Delivery</option>
              <option value="maintenance">Maintenance</option>
              <option value="visitor">Visitor</option>
              <option value="booking">Booking</option>
              <option value="complaint">Complaint</option>
              <option value="newsletter">Newsletter</option>
            </select>
          </div>
          
          <div className="form-field">
            <label>Message Content</label>
            <textarea
              value={newTemplate.content}
              onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Enter your template message..."
              rows={4}
              maxLength={500}
            />
            <div className="char-count">
              {newTemplate.content.length}/500
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              className="cancel-btn"
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </button>
            <button 
              className="save-btn"
              onClick={handleCreateTemplate}
            >
              Save Template
            </button>
          </div>
        </div>
      )}

      {customTemplates.length === 0 ? (
        <div className="empty-custom-templates">
          <div className="empty-icon">📝</div>
          <h4>No Custom Templates</h4>
          <p>Create your own templates for frequently used messages.</p>
        </div>
      ) : (
        <div className="templates-grid">
          {customTemplates.map((template) => (
            <div key={template.id} className="template-card custom-template">
              <div className="template-header">
                <h5 className="template-name">{template.name}</h5>
                <div className="template-meta">
                  <span className="template-category">{template.category}</span>
                  <span className="template-date">{formatDate(template.createdAt)}</span>
                </div>
              </div>
              <div className="template-preview">
                {template.content}
              </div>
              <div className="template-actions">
                <button 
                  className="use-template-btn"
                  onClick={() => onSelectTemplate(template)}
                >
                  Use Template
                </button>
                <button 
                  className="delete-template-btn"
                  onClick={() => handleDeleteTemplate(template.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="template-modal-overlay">
      <div className="template-modal">
        <div className="modal-header">
          <h3 className="modal-title">Message Templates</h3>
          <button className="close-btn" onClick={onClose}>
            <span>✕</span>
          </button>
        </div>

        <div className="modal-tabs">
          <button 
            className={`tab-btn ${activeTab === 'predefined' ? 'active' : ''}`}
            onClick={() => setActiveTab('predefined')}
          >
            Predefined Templates
          </button>
          <button 
            className={`tab-btn ${activeTab === 'custom' ? 'active' : ''}`}
            onClick={() => setActiveTab('custom')}
          >
            Custom Templates ({customTemplates.length})
          </button>
        </div>

        <div className="modal-content">
          {activeTab === 'predefined' ? renderPredefinedTemplates() : renderCustomTemplates()}
        </div>
      </div>
    </div>
  );
};

export default MessageTemplateModal;