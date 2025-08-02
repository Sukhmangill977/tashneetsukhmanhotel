// components/MessageComposer.js
import React, { useState, useEffect } from 'react';
import ContactSelector from './ContactSelector';
import './MessageComposer.css';

const MessageComposer = ({ 
  isOpen, 
  onClose, 
  onSend, 
  residents = [], 
  selectedContact, 
  setSelectedContact, 
  replyTo = null, 
  type = 'individual' // 'individual', 'mass', 'reply'
}) => {
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [sending, setSending] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [showContactSelector, setShowContactSelector] = useState(false);

  // Common message templates
  const messageTemplates = [
    {
      id: 'package_delivery',
      name: 'Package Delivery',
      content: 'Hi! A package has arrived for your unit. Please visit the front desk to collect it during business hours. Thank you!'
    },
    {
      id: 'maintenance_notice',
      name: 'Maintenance Notice', 
      content: 'Notice: Scheduled maintenance will occur in your building on [DATE] from [TIME]. Please plan accordingly. Contact us with any questions.'
    },
    {
      id: 'visitor_approval',
      name: 'Visitor Approved',
      content: 'Your visitor has been approved and registered. They can access the building using the provided access code. Thank you!'
    },
    {
      id: 'payment_reminder',
      name: 'Payment Reminder',
      content: 'Friendly reminder: Your monthly payment is due soon. Please contact the office if you have any questions.'
    },
    {
      id: 'amenity_booking',
      name: 'Amenity Booking Confirmed',
      content: 'Your amenity booking has been confirmed for [DATE] at [TIME]. Please arrive on time and follow all facility guidelines.'
    },
    {
      id: 'emergency_notice',
      name: 'Emergency Notice',
      content: 'URGENT: [EMERGENCY DETAILS]. Please follow emergency procedures and contact building management if needed.'
    }
  ];

  useEffect(() => {
    if (replyTo && replyTo.content) {
      setMessage(`Re: ${replyTo.content}\n\n`);
    }
  }, [replyTo]);

  useEffect(() => {
    setCharCount(message.length);
  }, [message]);

  const handleTemplateSelect = (template) => {
    setMessage(template.content);
    setSelectedTemplate(template.id);
  };

  const handleSend = async () => {
    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    if (type === 'individual' && !selectedContact) {
      alert('Please select a recipient');
      return;
    }

    setSending(true);
    
    try {
      await onSend({
        content: message.trim(),
        template: selectedTemplate || null,
        recipientCount: type === 'mass' ? residents.length : 1
      });
      
      setMessage('');
      setSelectedTemplate('');
      onClose();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'mass': return 'Send Mass Message';
      case 'reply': return `Reply to ${replyTo?.residentName || replyTo?.phoneNumber}`;
      case 'individual': return 'Send Message';
      default: return 'Send Message';
    }
  };

  const getRecipientInfo = () => {
    if (type === 'mass') {
      return `Sending to all ${residents.length} residents`;
    } else if (type === 'reply' && replyTo) {
      return `Replying to: ${replyTo.residentName || replyTo.phoneNumber}`;
    } else if (type === 'individual' && selectedContact) {
      return `Sending to: ${selectedContact.name} - Unit ${selectedContact.unitNumber}`;
    }
    return 'No recipient selected';
  };

  if (!isOpen) return null;

  return (
    <div className="message-composer-overlay">
      <div className="message-composer-modal">
        <div className="composer-header">
          <h2 className="composer-title">{getTitle()}</h2>
          <button className="close-btn" onClick={onClose}>
            <span>✕</span>
          </button>
        </div>

        <div className="composer-content">
          {/* Recipient Selection */}
          {type === 'individual' && !replyTo && (
            <div className="recipient-section">
              <label className="section-label">Recipient</label>
              {selectedContact ? (
                <div className="selected-contact">
                  <div className="contact-info">
                    <span className="contact-name">{selectedContact.name}</span>
                    <span className="contact-details">
                      Unit {selectedContact.unitNumber} • {selectedContact.phone}
                    </span>
                  </div>
                  <button 
                    className="change-contact-btn"
                    onClick={() => setShowContactSelector(true)}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button 
                  className="select-contact-btn"
                  onClick={() => setShowContactSelector(true)}
                >
                  <span className="select-icon">👤</span>
                  Select Recipient
                </button>
              )}
            </div>
          )}

          {/* Recipient Info Display */}
          <div className="recipient-info">
            <span className="info-icon">📋</span>
            <span className="info-text">{getRecipientInfo()}</span>
          </div>

          {/* Message Templates */}
          <div className="templates-section">
            <label className="section-label">Quick Templates</label>
            <div className="templates-grid">
              {messageTemplates.map((template) => (
                <button
                  key={template.id}
                  className={`template-btn ${selectedTemplate === template.id ? 'active' : ''}`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div className="message-section">
            <label className="section-label">
              Message
              <span className="char-count">
                {charCount}/160 {charCount > 160 && '(Additional charges may apply)'}
              </span>
            </label>
            <textarea
              className={`message-textarea ${charCount > 160 ? 'over-limit' : ''}`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={6}
              maxLength={500}
            />
            
            {/* Message Preview */}
            {message && (
              <div className="message-preview">
                <div className="preview-label">Preview:</div>
                <div className="preview-content">
                  {message}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="composer-actions">
            <button 
              className="cancel-btn" 
              onClick={onClose}
              disabled={sending}
            >
              Cancel
            </button>
            <button 
              className="send-btn" 
              onClick={handleSend}
              disabled={sending || !message.trim() || (type === 'individual' && !selectedContact && !replyTo)}
            >
              {sending ? (
                <>
                  <span className="sending-spinner"></span>
                  Sending...
                </>
              ) : (
                <>
                  <span className="send-icon">📤</span>
                  {type === 'mass' ? `Send to ${residents.length} residents` : 'Send Message'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Contact Selector Modal */}
        {showContactSelector && (
          <ContactSelector
            isOpen={showContactSelector}
            onClose={() => setShowContactSelector(false)}
            residents={residents}
            onSelect={(contact) => {
              setSelectedContact(contact);
              setShowContactSelector(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MessageComposer;