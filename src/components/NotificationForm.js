// components/NotificationForm.js
import React, { useState, useEffect } from 'react';
import './NotificationForm.css';

const NotificationForm = ({ package: pkg, guests, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    recipientType: 'package', // package, custom
    recipient: '',
    recipientEmail: '',
    recipientPhone: '',
    notificationType: 'both', // sms, email, both
    messageTemplate: 'package_arrival',
    customMessage: '',
    subject: '',
    sendTime: 'now', // now, scheduled
    scheduledDateTime: '',
    includePackageDetails: true,
    includePickupInstructions: true
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [messagePreview, setMessagePreview] = useState('');

  const messageTemplates = {
    package_arrival: {
      name: 'Package Arrival Notification',
      sms: 'Hi {name}, your package from {courier} has arrived at the front desk. Please visit us to collect it. Thank you!',
      email: {
        subject: 'Package Delivery Notification - Unit {unit}',
        body: `Dear {name},

We are pleased to inform you that a package has been delivered for Unit {unit}.

Package Details:
- Courier: {courier}
- Description: {description}
- Delivered: {delivered_time}
- Received by: {received_by}

Please visit the front desk during business hours to collect your package. Remember to bring a valid ID.

If you have any questions, please don't hesitate to contact us.

Best regards,
Building Management`
      }
    },
    package_reminder: {
      name: 'Package Pickup Reminder',
      sms: 'Reminder: Your package from {courier} is still waiting for pickup at the front desk. Unit {unit}.',
      email: {
        subject: 'Package Pickup Reminder - Unit {unit}',
        body: `Dear {name},

This is a friendly reminder that you have a package waiting for pickup at the front desk.

Package Details:
- Courier: {courier}
- Description: {description}
- Delivered: {delivered_time}

Please collect your package at your earliest convenience during business hours.

Thank you,
Building Management`
      }
    },
    general_announcement: {
      name: 'General Announcement',
      sms: '',
      email: {
        subject: '',
        body: ''
      }
    }
  };

  useEffect(() => {
    if (pkg) {
      // Pre-fill with package recipient info
      setFormData(prev => ({
        ...prev,
        recipient: pkg.guestName,
        recipientEmail: pkg.recipientEmail,
        recipientPhone: pkg.recipientPhone
      }));
    }
  }, [pkg]);

  useEffect(() => {
    generateMessagePreview();
  }, [formData, pkg]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleRecipientChange = (e) => {
    const recipientId = e.target.value;
    if (recipientId === 'package' && pkg) {
      setFormData(prev => ({
        ...prev,
        recipientType: 'package',
        recipient: pkg.guestName,
        recipientEmail: pkg.recipientEmail,
        recipientPhone: pkg.recipientPhone
      }));
    } else if (recipientId === 'custom') {
      setFormData(prev => ({
        ...prev,
        recipientType: 'custom',
        recipient: '',
        recipientEmail: '',
        recipientPhone: ''
      }));
    } else {
      const selectedguest = guests.find(r => r.id === recipientId);
      if (selectedguest) {
        setFormData(prev => ({
          ...prev,
          recipientType: 'guest',
          recipient: selectedguest.name,
          recipientEmail: selectedguest.email,
          recipientPhone: selectedguest.phone
        }));
      }
    }
  };

  const generateMessagePreview = () => {
    const template = messageTemplates[formData.messageTemplate];
    if (!template) return;

    let message = '';
    if (formData.messageTemplate === 'general_announcement') {
      message = formData.customMessage;
    } else {
      if (formData.notificationType === 'email' || formData.notificationType === 'both') {
        message = template.email.body;
      } else {
        message = template.sms;
      }

      // Replace placeholders
      if (pkg) {
        message = message
          .replace(/\{name\}/g, formData.recipient || '{name}')
          .replace(/\{unit\}/g, pkg.roomNumber || '{unit}')
          .replace(/\{courier\}/g, pkg.courier || '{courier}')
          .replace(/\{description\}/g, pkg.description || '{description}')
          .replace(/\{delivered_time\}/g, pkg.deliveredAt ? pkg.deliveredAt.toLocaleString() : '{delivered_time}')
          .replace(/\{received_by\}/g, pkg.receivedBy || '{received_by}');
      }
    }

    setMessagePreview(message);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.recipient.trim()) {
      newErrors.recipient = 'Recipient name is required';
    }

    if (formData.notificationType === 'email' || formData.notificationType === 'both') {
      if (!formData.recipientEmail.trim()) {
        newErrors.recipientEmail = 'Email address is required for email notifications';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.recipientEmail)) {
        newErrors.recipientEmail = 'Please enter a valid email address';
      }
    }

    if (formData.notificationType === 'sms' || formData.notificationType === 'both') {
      if (!formData.recipientPhone.trim()) {
        newErrors.recipientPhone = 'Phone number is required for SMS notifications';
      }
    }

    if (formData.messageTemplate === 'general_announcement') {
      if (!formData.customMessage.trim()) {
        newErrors.customMessage = 'Message content is required';
      }
      if (formData.notificationType === 'email' || formData.notificationType === 'both') {
        if (!formData.subject.trim()) {
          newErrors.subject = 'Email subject is required';
        }
      }
    }

    if (formData.sendTime === 'scheduled') {
      if (!formData.scheduledDateTime) {
        newErrors.scheduledDateTime = 'Scheduled time is required';
      } else {
        const scheduledTime = new Date(formData.scheduledDateTime);
        if (scheduledTime <= new Date()) {
          newErrors.scheduledDateTime = 'Scheduled time must be in the future';
        }
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
      const template = messageTemplates[formData.messageTemplate];
      
      let emailContent = null;
      let smsContent = null;

      if (formData.notificationType === 'email' || formData.notificationType === 'both') {
        if (formData.messageTemplate === 'general_announcement') {
          emailContent = {
            subject: formData.subject,
            body: formData.customMessage
          };
        } else {
          emailContent = {
            subject: template.email.subject,
            body: template.email.body
          };
        }
      }

      if (formData.notificationType === 'sms' || formData.notificationType === 'both') {
        if (formData.messageTemplate === 'general_announcement') {
          smsContent = formData.customMessage;
        } else {
          smsContent = template.sms;
        }
      }

      const notificationData = {
        recipient: {
          name: formData.recipient.trim(),
          email: formData.recipientEmail.trim(),
          phone: formData.recipientPhone.trim()
        },
        notificationType: formData.notificationType,
        messageTemplate: formData.messageTemplate,
        emailContent,
        smsContent,
        sendTime: formData.sendTime,
        scheduledDateTime: formData.sendTime === 'scheduled' ? new Date(formData.scheduledDateTime) : null,
        packageId: pkg?.id || null,
        includePackageDetails: formData.includePackageDetails,
        includePickupInstructions: formData.includePickupInstructions
      };

      await onSubmit(notificationData);
    } catch (error) {
      console.error('Error submitting notification form:', error);
      setErrors({ general: 'Failed to send notification. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const getSubject = () => {
    if (formData.messageTemplate === 'general_announcement') {
      return formData.subject;
    }
    const template = messageTemplates[formData.messageTemplate];
    return template?.email?.subject || '';
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="notification-form-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Send Notification</h2>
          <button className="close-button" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none">
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="notification-form">
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
            <h3 className="section-title">Recipient</h3>
            
            <div className="form-group">
              <label htmlFor="recipientSelect" className="form-label">
                Select Recipient
              </label>
              <select
                id="recipientSelect"
                onChange={handleRecipientChange}
                className="form-select"
                value={formData.recipientType === 'package' ? 'package' : formData.recipientType === 'custom' ? 'custom' : ''}
              >
                {pkg && <option value="package">Package Recipient: {pkg.guestName}</option>}
                <option value="custom">Custom Recipient</option>
                <optgroup label="guests">
                  {guests.map(guest => (
                    <option key={guest.id} value={guest.id}>
                      {guest.name} - Unit {guest.roomNumber}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="recipient" className="form-label">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  id="recipient"
                  name="recipient"
                  value={formData.recipient}
                  onChange={handleInputChange}
                  className={`form-input ${errors.recipient ? 'error' : ''}`}
                  placeholder="Full name"
                  required
                />
                {errors.recipient && (
                  <span className="error-message">{errors.recipient}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="notificationType" className="form-label">
                  Notification Type *
                </label>
                <select
                  id="notificationType"
                  name="notificationType"
                  value={formData.notificationType}
                  onChange={handleInputChange}
                  className="form-select"
                  required
                >
                  <option value="both">SMS + Email</option>
                  <option value="sms">SMS Only</option>
                  <option value="email">Email Only</option>
                </select>
              </div>
            </div>

            {(formData.notificationType === 'email' || formData.notificationType === 'both') && (
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
            )}

            {(formData.notificationType === 'sms' || formData.notificationType === 'both') && (
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
            )}
          </div>

          <div className="form-section">
            <h3 className="section-title">Message</h3>
            
            <div className="form-group">
              <label htmlFor="messageTemplate" className="form-label">
                Message Template
              </label>
              <select
                id="messageTemplate"
                name="messageTemplate"
                value={formData.messageTemplate}
                onChange={handleInputChange}
                className="form-select"
              >
                {Object.entries(messageTemplates).map(([key, template]) => (
                  <option key={key} value={key}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            {formData.messageTemplate === 'general_announcement' && (
              <>
                {(formData.notificationType === 'email' || formData.notificationType === 'both') && (
                  <div className="form-group">
                    <label htmlFor="subject" className="form-label">
                      Email Subject *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className={`form-input ${errors.subject ? 'error' : ''}`}
                      placeholder="Email subject line"
                      required
                    />
                    {errors.subject && (
                      <span className="error-message">{errors.subject}</span>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="customMessage" className="form-label">
                    Message Content *
                  </label>
                  <textarea
                    id="customMessage"
                    name="customMessage"
                    value={formData.customMessage}
                    onChange={handleInputChange}
                    className={`form-textarea ${errors.customMessage ? 'error' : ''}`}
                    placeholder="Enter your message content..."
                    rows={6}
                    required
                  />
                  {errors.customMessage && (
                    <span className="error-message">{errors.customMessage}</span>
                  )}
                </div>
              </>
            )}

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="sendTime" className="form-label">
                  Send Time
                </label>
                <select
                  id="sendTime"
                  name="sendTime"
                  value={formData.sendTime}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="now">Send Now</option>
                  <option value="scheduled">Schedule for Later</option>
                </select>
              </div>

              {formData.sendTime === 'scheduled' && (
                <div className="form-group">
                  <label htmlFor="scheduledDateTime" className="form-label">
                    Scheduled Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    id="scheduledDateTime"
                    name="scheduledDateTime"
                    value={formData.scheduledDateTime}
                    onChange={handleInputChange}
                    className={`form-input ${errors.scheduledDateTime ? 'error' : ''}`}
                    required
                  />
                  {errors.scheduledDateTime && (
                    <span className="error-message">{errors.scheduledDateTime}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Message Preview</h3>
            <div className="message-preview">
              {(formData.notificationType === 'email' || formData.notificationType === 'both') && (
                <div className="preview-section">
                  <h4>Email Subject:</h4>
                  <div className="preview-content subject">
                    {getSubject() || 'No subject'}
                  </div>
                </div>
              )}
              <div className="preview-section">
                <h4>Message Content:</h4>
                <div className="preview-content">
                  {messagePreview || 'No message content'}
                </div>
              </div>
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
                  Sending...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {formData.sendTime === 'scheduled' ? 'Schedule Notification' : 'Send Notification'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NotificationForm;