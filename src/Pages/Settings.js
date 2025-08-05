// pages/Settings.js
import React, { useState, useEffect } from 'react';
import { auth } from '../firebase-config';
import { sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { dbService } from '../database-service';
import Layout from '../components/Layout';
import './Settings.css';

const Settings = () => {
  const [userCompany, setUserCompany] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('company');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Company Settings State
  const [companySettings, setCompanySettings] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    businessHours: {
      start: '09:00',
      end: '17:00',
      timezone: 'America/Toronto'
    },
    twilioSettings: {
      phoneNumber: '',
      accountSid: '',
      authToken: '',
      enabled: false
    },
    retellSettings: {
      agentId: '',
      apiKey: '',
      enabled: false
    },
    notifications: {
      emailAlerts: true,
      smsAlerts: true,
      emergencyOnly: false
    },
    automations: {
      autoResponder: false,
      packageNotifications: true,
      bookingConfirmations: true,
      maintenanceAlerts: true
    }
  });

  // Profile Settings State
  const [profileSettings, setProfileSettings] = useState({
    displayName: '',
    email: '',
    role: 'concierge',
    preferences: {
      theme: 'light',
      language: 'en',
      notifications: true,
      emailDigest: 'daily'
    }
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        await loadUserData(user.email);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadUserData = async (email) => {
    try {
      const company = await dbService.getCompanyByEmail(email);
      const profile = await dbService.getUserProfile(auth.currentUser?.uid);
      
      setUserCompany(company);
      setUserProfile(profile);
      
      if (company) {
        setCompanySettings({
          name: company.name || '',
          address: company.address || '',
          phone: company.phone || '',
          email: company.email || '',
          businessHours: company.settings?.businessHours || {
            start: '09:00',
            end: '17:00',
            timezone: 'America/Toronto'
          },
          twilioSettings: company.settings?.twilioSettings || {
            phoneNumber: '',
            accountSid: '',
            authToken: '',
            enabled: false
          },
          retellSettings: company.settings?.retellSettings || {
            agentId: '',
            apiKey: '',
            enabled: false
          },
          notifications: company.settings?.notifications || {
            emailAlerts: true,
            smsAlerts: true,
            emergencyOnly: false
          },
          automations: company.settings?.automations || {
            autoResponder: false,
            packageNotifications: true,
            bookingConfirmations: true,
            maintenanceAlerts: true
          }
        });
      }
      
      if (profile) {
        setProfileSettings({
          displayName: profile.displayName || auth.currentUser?.displayName || '',
          email: auth.currentUser?.email || '',
          role: profile.role || 'concierge',
          preferences: profile.preferences || {
            theme: 'light',
            language: 'en',
            notifications: true,
            emailDigest: 'daily'
          }
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setErrorMessage('Failed to load settings data');
    }
  };

  const handleCompanySettingsChange = (section, field, value) => {
    setCompanySettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleProfileSettingsChange = (section, field, value) => {
    setProfileSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const saveCompanySettings = async () => {
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const updatedCompany = {
        ...userCompany,
        name: companySettings.name,
        address: companySettings.address,
        phone: companySettings.phone,
        email: companySettings.email,
        settings: {
          businessHours: companySettings.businessHours,
          twilioSettings: companySettings.twilioSettings,
          retellSettings: companySettings.retellSettings,
          notifications: companySettings.notifications,
          automations: companySettings.automations,
          updatedAt: new Date()
        }
      };

      await dbService.updatehotel(userCompany.id, updatedCompany);
      setUserCompany(updatedCompany);
      setSuccessMessage('Company settings saved successfully!');
    } catch (error) {
      console.error('Error saving company settings:', error);
      setErrorMessage('Failed to save company settings');
    } finally {
      setSaving(false);
    }
  };

  const saveProfileSettings = async () => {
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        displayName: profileSettings.displayName
      });

      // Update user profile in Firestore
      const updatedProfile = {
        displayName: profileSettings.displayName,
        role: profileSettings.role,
        preferences: profileSettings.preferences,
        updatedAt: new Date()
      };

      await dbService.updateUserProfile(auth.currentUser.uid, updatedProfile);
      setUserProfile(prev => ({ ...prev, ...updatedProfile }));
      setSuccessMessage('Profile settings saved successfully!');
    } catch (error) {
      console.error('Error saving profile settings:', error);
      setErrorMessage('Failed to save profile settings');
    } finally {
      setSaving(false);
    }
  };

  const sendPasswordReset = async () => {
    try {
      await sendPasswordResetEmail(auth, auth.currentUser.email);
      setSuccessMessage('Password reset email sent! Check your inbox.');
    } catch (error) {
      console.error('Error sending password reset:', error);
      setErrorMessage('Failed to send password reset email');
    }
  };

  const testTwilioConnection = async () => {
    // This would test the Twilio connection
    setSuccessMessage('Twilio connection test would be implemented here');
  };

  const testRetellConnection = async () => {
    // This would test the Retell AI connection
    setSuccessMessage('Retell AI connection test would be implemented here');
  };

  const renderCompanySettings = () => (
    <div className="settings-section">
      <div className="section-header">
        <h3 className="section-title">Company Information</h3>
        <p className="section-description">Manage your property management company details</p>
      </div>

      <div className="settings-grid">
        <div className="setting-group">
          <label className="setting-label">Company Name</label>
          <input
            type="text"
            value={companySettings.name}
            onChange={(e) => setCompanySettings(prev => ({ ...prev, name: e.target.value }))}
            className="setting-input"
            placeholder="Your Company Name"
          />
        </div>

        <div className="setting-group">
          <label className="setting-label">Business Phone</label>
          <input
            type="tel"
            value={companySettings.phone}
            onChange={(e) => setCompanySettings(prev => ({ ...prev, phone: e.target.value }))}
            className="setting-input"
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div className="setting-group full-width">
          <label className="setting-label">Address</label>
          <input
            type="text"
            value={companySettings.address}
            onChange={(e) => setCompanySettings(prev => ({ ...prev, address: e.target.value }))}
            className="setting-input"
            placeholder="123 Main Street, City, Province"
          />
        </div>

        <div className="setting-group">
          <label className="setting-label">Contact Email</label>
          <input
            type="email"
            value={companySettings.email}
            onChange={(e) => setCompanySettings(prev => ({ ...prev, email: e.target.value }))}
            className="setting-input"
            placeholder="contact@company.com"
          />
        </div>
      </div>

      <div className="section-divider"></div>

      <div className="section-header">
        <h3 className="section-title">Business Hours</h3>
        <p className="section-description">Set your operating hours and timezone</p>
      </div>

      <div className="settings-grid">
        <div className="setting-group">
          <label className="setting-label">Start Time</label>
          <input
            type="time"
            value={companySettings.businessHours.start}
            onChange={(e) => handleCompanySettingsChange('businessHours', 'start', e.target.value)}
            className="setting-input"
          />
        </div>

        <div className="setting-group">
          <label className="setting-label">End Time</label>
          <input
            type="time"
            value={companySettings.businessHours.end}
            onChange={(e) => handleCompanySettingsChange('businessHours', 'end', e.target.value)}
            className="setting-input"
          />
        </div>

        <div className="setting-group">
          <label className="setting-label">Timezone</label>
          <select
            value={companySettings.businessHours.timezone}
            onChange={(e) => handleCompanySettingsChange('businessHours', 'timezone', e.target.value)}
            className="setting-select"
          >
            <option value="America/Toronto">Eastern Time (Toronto)</option>
            <option value="America/Vancouver">Pacific Time (Vancouver)</option>
            <option value="America/Edmonton">Mountain Time (Edmonton)</option>
            <option value="America/Winnipeg">Central Time (Winnipeg)</option>
            <option value="America/Halifax">Atlantic Time (Halifax)</option>
          </select>
        </div>
      </div>

      <div className="section-divider"></div>

      <div className="section-header">
        <h3 className="section-title">Twilio SMS Configuration</h3>
        <p className="section-description">Configure SMS messaging service</p>
      </div>

      <div className="integration-card">
        <div className="integration-header">
          <div className="integration-info">
            <div className="integration-icon twilio">📱</div>
            <div>
              <h4>Twilio SMS</h4>
              <p>Send SMS messages to guests</p>
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={companySettings.twilioSettings.enabled}
              onChange={(e) => handleCompanySettingsChange('twilioSettings', 'enabled', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {companySettings.twilioSettings.enabled && (
          <div className="integration-settings">
            <div className="settings-grid">
              <div className="setting-group">
                <label className="setting-label">Phone Number</label>
                <input
                  type="tel"
                  value={companySettings.twilioSettings.phoneNumber}
                  onChange={(e) => handleCompanySettingsChange('twilioSettings', 'phoneNumber', e.target.value)}
                  className="setting-input"
                  placeholder="+1 (555) 123-4567"
                />
                <span className="setting-help">Your Twilio phone number for sending messages</span>
              </div>

              <div className="setting-group">
                <label className="setting-label">Account SID</label>
                <input
                  type="text"
                  value={companySettings.twilioSettings.accountSid}
                  onChange={(e) => handleCompanySettingsChange('twilioSettings', 'accountSid', e.target.value)}
                  className="setting-input"
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
              </div>

              <div className="setting-group">
                <label className="setting-label">Auth Token</label>
                <input
                  type="password"
                  value={companySettings.twilioSettings.authToken}
                  onChange={(e) => handleCompanySettingsChange('twilioSettings', 'authToken', e.target.value)}
                  className="setting-input"
                  placeholder="Your Twilio Auth Token"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={testTwilioConnection}
              className="test-connection-btn"
            >
              Test Connection
            </button>
          </div>
        )}
      </div>

      <div className="section-divider"></div>

      <div className="section-header">
        <h3 className="section-title">Retell AI Configuration</h3>
        <p className="section-description">Configure AI phone call handling</p>
      </div>

      <div className="integration-card">
        <div className="integration-header">
          <div className="integration-info">
            <div className="integration-icon retell">🤖</div>
            <div>
              <h4>Retell AI</h4>
              <p>AI-powered phone call management</p>
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={companySettings.retellSettings.enabled}
              onChange={(e) => handleCompanySettingsChange('retellSettings', 'enabled', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {companySettings.retellSettings.enabled && (
          <div className="integration-settings">
            <div className="settings-grid">
              <div className="setting-group">
                <label className="setting-label">Agent ID</label>
                <input
                  type="text"
                  value={companySettings.retellSettings.agentId}
                  onChange={(e) => handleCompanySettingsChange('retellSettings', 'agentId', e.target.value)}
                  className="setting-input"
                  placeholder="agent_xxxxxxxxxxxxxxxx"
                />
              </div>

              <div className="setting-group">
                <label className="setting-label">API Key</label>
                <input
                  type="password"
                  value={companySettings.retellSettings.apiKey}
                  onChange={(e) => handleCompanySettingsChange('retellSettings', 'apiKey', e.target.value)}
                  className="setting-input"
                  placeholder="Your Retell AI API Key"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={testRetellConnection}
              className="test-connection-btn"
            >
              Test Connection
            </button>
          </div>
        )}
      </div>

      <div className="section-divider"></div>

      <div className="section-header">
        <h3 className="section-title">Automation Settings</h3>
        <p className="section-description">Configure automated notifications and responses</p>
      </div>

      <div className="automation-grid">
        <div className="automation-item">
          <div className="automation-info">
            <h4>Package Notifications</h4>
            <p>Automatically notify guests when packages arrive</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={companySettings.automations.packageNotifications}
              onChange={(e) => handleCompanySettingsChange('automations', 'packageNotifications', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="automation-item">
          <div className="automation-info">
            <h4>Booking Confirmations</h4>
            <p>Send automatic confirmation messages for bookings</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={companySettings.automations.bookingConfirmations}
              onChange={(e) => handleCompanySettingsChange('automations', 'bookingConfirmations', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="automation-item">
          <div className="automation-info">
            <h4>Maintenance Alerts</h4>
            <p>Notify guests about scheduled maintenance</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={companySettings.automations.maintenanceAlerts}
              onChange={(e) => handleCompanySettingsChange('automations', 'maintenanceAlerts', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="automation-item">
          <div className="automation-info">
            <h4>Auto Responder</h4>
            <p>Send automatic replies to common inquiries</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={companySettings.automations.autoResponder}
              onChange={(e) => handleCompanySettingsChange('automations', 'autoResponder', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div className="section-actions">
        <button
          type="button"
          onClick={saveCompanySettings}
          disabled={saving}
          className="save-btn primary"
        >
          {saving ? 'Saving...' : 'Save Company Settings'}
        </button>
      </div>
    </div>
  );

  const renderProfileSettings = () => (
    <div className="settings-section">
      <div className="section-header">
        <h3 className="section-title">Profile Information</h3>
        <p className="section-description">Manage your personal account settings</p>
      </div>

      <div className="profile-card">
        <div className="profile-avatar">
          {profileSettings.displayName.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="profile-info">
          <h4>{profileSettings.displayName || 'User'}</h4>
          <p>{profileSettings.email}</p>
          <span className="role-badge">{profileSettings.role}</span>
        </div>
      </div>

      <div className="settings-grid">
        <div className="setting-group">
          <label className="setting-label">Display Name</label>
          <input
            type="text"
            value={profileSettings.displayName}
            onChange={(e) => setProfileSettings(prev => ({ ...prev, displayName: e.target.value }))}
            className="setting-input"
            placeholder="Your display name"
          />
        </div>

        <div className="setting-group">
          <label className="setting-label">Email Address</label>
          <input
            type="email"
            value={profileSettings.email}
            className="setting-input"
            disabled
          />
          <span className="setting-help">Email address cannot be changed</span>
        </div>

        <div className="setting-group">
          <label className="setting-label">Role</label>
          <input
            type="text"
            value={profileSettings.role}
            className="setting-input"
            disabled
          />
        </div>
      </div>

      <div className="section-divider"></div>

      <div className="section-header">
        <h3 className="section-title">Security</h3>
        <p className="section-description">Manage your account security settings</p>
      </div>

      <div className="security-actions">
        <button
          type="button"
          onClick={sendPasswordReset}
          className="security-btn"
        >
          <div className="security-btn-content">
            <div className="security-icon">🔒</div>
            <div>
              <h4>Change Password</h4>
              <p>Send a password reset link to your email</p>
            </div>
          </div>
          <div className="security-arrow">→</div>
        </button>
      </div>

      <div className="section-divider"></div>

      <div className="section-header">
        <h3 className="section-title">Preferences</h3>
        <p className="section-description">Customize your experience</p>
      </div>

      <div className="preferences-grid">
        <div className="preference-item">
          <div className="preference-info">
            <h4>Theme</h4>
            <p>Choose your preferred interface theme</p>
          </div>
          <select
            value={profileSettings.preferences.theme}
            onChange={(e) => handleProfileSettingsChange('preferences', 'theme', e.target.value)}
            className="setting-select"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto</option>
          </select>
        </div>

        <div className="preference-item">
          <div className="preference-info">
            <h4>Language</h4>
            <p>Select your preferred language</p>
          </div>
          <select
            value={profileSettings.preferences.language}
            onChange={(e) => handleProfileSettingsChange('preferences', 'language', e.target.value)}
            className="setting-select"
          >
            <option value="en">English</option>
            <option value="fr">French</option>
            <option value="es">Spanish</option>
          </select>
        </div>

        <div className="preference-item">
          <div className="preference-info">
            <h4>Email Notifications</h4>
            <p>Receive updates via email</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={profileSettings.preferences.notifications}
              onChange={(e) => handleProfileSettingsChange('preferences', 'notifications', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="preference-item">
          <div className="preference-info">
            <h4>Email Digest</h4>
            <p>How often to receive summary emails</p>
          </div>
          <select
            value={profileSettings.preferences.emailDigest}
            onChange={(e) => handleProfileSettingsChange('preferences', 'emailDigest', e.target.value)}
            className="setting-select"
          >
            <option value="none">Never</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      <div className="section-actions">
        <button
          type="button"
          onClick={saveProfileSettings}
          disabled={saving}
          className="save-btn primary"
        >
          {saving ? 'Saving...' : 'Save Profile Settings'}
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout currentPageName="Settings">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading settings...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPageName="Settings">
      <div className="settings-page">
        <div className="settings-header">
          <h1 className="page-title">Settings</h1>
          <p className="page-description">
            Configure your company settings, integrations, and preferences
          </p>
        </div>

        {successMessage && (
          <div className="alert alert-success">
            <span className="alert-icon">✅</span>
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="alert alert-error">
            <span className="alert-icon">❌</span>
            {errorMessage}
          </div>
        )}

        <div className="settings-container">
          <div className="settings-tabs">
            <button
              className={`tab-btn ${activeTab === 'company' ? 'active' : ''}`}
              onClick={() => setActiveTab('company')}
            >
              <span className="tab-icon">🏢</span>
              Company Settings
            </button>
            <button
              className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <span className="tab-icon">👤</span>
              Profile & Security
            </button>
          </div>

          <div className="settings-content">
            {activeTab === 'company' ? renderCompanySettings() : renderProfileSettings()}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;