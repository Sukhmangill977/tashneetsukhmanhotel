import React, { useState, useEffect } from 'react';
import { auth } from '../firebase-config';
import { dbService } from '../database-service';
import Layout from '../components/Layout';
import BookingForm from '../components/BookingForm';
import './ServiceBookingCalendar.css';

const ServiceBookingCalendar = () => {
  const [userCompany, setUserCompany] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [guests, setguests] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calendarView, setCalendarView] = useState('month'); // month, week, day

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
      setUserCompany(company);
      
      if (company) {
        await Promise.all([
          loadBookings(company.id),
          loadguests(company.id)
        ]);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadBookings = async (companyId) => {
    try {
      const bookingsData = await dbService.getBookingsByCompany(companyId);
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const loadguests = async (companyId) => {
    try {
      const guestsData = await dbService.getguestsByCompany(companyId);
      setguests(guestsData);
    } catch (error) {
      console.error('Error loading guests:', error);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevDate = new Date(year, month, -startingDayOfWeek + i + 1);
      days.push({ date: prevDate, isCurrentMonth: false, bookings: [] });
    }
    
    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayBookings = getBookingsForDate(date);
      days.push({ date, isCurrentMonth: true, bookings: dayBookings });
    }
    
    // Add days from next month to complete the grid
    const remainingCells = 42 - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({ date: nextDate, isCurrentMonth: false, bookings: [] });
    }
    
    return days;
  };

  const getBookingsForDate = (date) => {
    return bookings.filter(booking => {
      const bookingDate = booking.startDate.toDate ? booking.startDate.toDate() : new Date(booking.startDate);
      return bookingDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const formatTime = (timestamp) => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString([], { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getAmenityColor = (amenityId) => {
    const colors = {
      'party-room-a': '#3b82f6',
      'party-room-b': '#8b5cf6',
      'visitor-parking': '#10b981',
      'gym': '#f59e0b',
      'pool': '#06b6d4',
      'bbq': '#ef4444',
      'default': '#6b7280'
    };
    return colors[amenityId] || colors.default;
  };

  const handleDateClick = (day) => {
    setSelectedDate(day.date);
    if (day.bookings.length > 0) {
      // Show booking details
      setSelectedBooking(day.bookings[0]);
    }
  };

  const handleNewBooking = () => {
    setSelectedBooking(null);
    setShowBookingForm(true);
  };

  const handleEditBooking = (booking) => {
    setSelectedBooking(booking);
    setShowBookingForm(true);
  };

  const handleBookingSubmit = async (bookingData) => {
    try {
      if (selectedBooking) {
        // Update existing booking
        await dbService.updateBooking(selectedBooking.id, bookingData);
      } else {
        // Create new booking
        await dbService.createBooking(userCompany.id, bookingData);
      }
      
      // Reload bookings
      await loadBookings(userCompany.id);
      setShowBookingForm(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error saving booking:', error);
    }
  };

  const getTodaysBookings = () => {
    const today = new Date();
    return getBookingsForDate(today);
  };

  const getUpcomingBookings = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return bookings.filter(booking => {
      const bookingDate = booking.startDate.toDate ? booking.startDate.toDate() : new Date(booking.startDate);
      return bookingDate >= today && bookingDate <= nextWeek;
    }).sort((a, b) => {
      const dateA = a.startDate.toDate ? a.startDate.toDate() : new Date(a.startDate);
      const dateB = b.startDate.toDate ? b.startDate.toDate() : new Date(b.startDate);
      return dateA - dateB;
    });
  };

  if (loading) {
    return (
      <Layout currentPageName="Booking Calendar">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading calendar...</p>
        </div>
      </Layout>
    );
  }

  const calendarDays = getDaysInMonth(currentMonth);
  const todaysBookings = getTodaysBookings();
  const upcomingBookings = getUpcomingBookings();

  return (
    <Layout currentPageName="Booking Calendar">
      <div className="booking-calendar">
        {/* Page Header */}
        <div className="page-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title">Booking Calendar</h1>
              <p className="page-description">
                Manage amenity reservations and facility bookings
              </p>
            </div>
            <div className="header-actions">
              <div className="view-toggle">
                <button 
                  className={`view-btn ${calendarView === 'month' ? 'active' : ''}`}
                  onClick={() => setCalendarView('month')}
                >
                  Month
                </button>
                <button 
                  className={`view-btn ${calendarView === 'week' ? 'active' : ''}`}
                  onClick={() => setCalendarView('week')}
                >
                  Week
                </button>
                <button 
                  className={`view-btn ${calendarView === 'day' ? 'active' : ''}`}
                  onClick={() => setCalendarView('day')}
                >
                  Day
                </button>
              </div>
              <button className="primary-btn" onClick={handleNewBooking}>
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                New Booking
              </button>
            </div>
          </div>
        </div>

        <div className="calendar-container">
          {/* Left Sidebar */}
          <div className="calendar-sidebar">
            {/* Today's Bookings */}
            <div className="sidebar-section">
              <h3 className="section-title">Today's Bookings</h3>
              <div className="bookings-list">
                {todaysBookings.length > 0 ? (
                  todaysBookings.map((booking) => (
                    <div key={booking.id} className="booking-item today">
                      <div 
                        className="booking-color" 
                        style={{ backgroundColor: getAmenityColor(booking.amenityId) }}
                      ></div>
                      <div className="booking-details">
                        <h4>{booking.title}</h4>
                        <p className="booking-time">
                          {formatTime(booking.startDate)} - {formatTime(booking.endDate)}
                        </p>
                        <p className="booking-contact">{booking.contactInfo?.name}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-bookings">
                    <svg viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <p>No bookings today</p>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Bookings */}
            <div className="sidebar-section">
              <h3 className="section-title">Upcoming This Week</h3>
              <div className="bookings-list">
                {upcomingBookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="booking-item upcoming">
                    <div 
                      className="booking-color" 
                      style={{ backgroundColor: getAmenityColor(booking.amenityId) }}
                    ></div>
                    <div className="booking-details">
                      <h4>{booking.title}</h4>
                      <p className="booking-date">
                        {formatDate(booking.startDate.toDate ? booking.startDate.toDate() : new Date(booking.startDate))}
                      </p>
                      <p className="booking-time">
                        {formatTime(booking.startDate)}
                      </p>
                    </div>
                  </div>
                ))}
                {upcomingBookings.length === 0 && (
                  <div className="no-bookings">
                    <svg viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                      <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <p>No upcoming bookings</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="sidebar-section">
              <h3 className="section-title">Quick Stats</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{todaysBookings.length}</div>
                  <div className="stat-label">Today</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{upcomingBookings.length}</div>
                  <div className="stat-label">This Week</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{bookings.length}</div>
                  <div className="stat-label">Total</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Calendar */}
          <div className="calendar-main">
            {/* Calendar Header */}
            <div className="calendar-header">
              <div className="month-navigation">
                <button className="nav-btn" onClick={() => navigateMonth(-1)}>
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <h2 className="month-title">
                  {currentMonth.toLocaleDateString([], { month: 'long', year: 'numeric' })}
                </h2>
                <button className="nav-btn" onClick={() => navigateMonth(1)}>
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <button 
                className="today-btn"
                onClick={() => {
                  setCurrentMonth(new Date());
                  setSelectedDate(new Date());
                }}
              >
                Today
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="calendar-grid">
              {/* Days of week header */}
              <div className="calendar-header-row">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="day-header">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="calendar-body">
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`calendar-day ${
                      !day.isCurrentMonth ? 'other-month' : ''
                    } ${
                      day.date.toDateString() === new Date().toDateString() ? 'today' : ''
                    } ${
                      day.date.toDateString() === selectedDate.toDateString() ? 'selected' : ''
                    }`}
                    onClick={() => handleDateClick(day)}
                  >
                    <div className="day-number">{day.date.getDate()}</div>
                    <div className="day-bookings">
                      {day.bookings.slice(0, 3).map((booking) => (
                        <div
                          key={booking.id}
                          className="booking-event"
                          style={{ backgroundColor: getAmenityColor(booking.amenityId) }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditBooking(booking);
                          }}
                          title={`${booking.title} - ${formatTime(booking.startDate)}`}
                        >
                          <span className="booking-title">{booking.title}</span>
                        </div>
                      ))}
                      {day.bookings.length > 3 && (
                        <div className="more-bookings">
                          +{day.bookings.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Booking Form Modal */}
        {showBookingForm && (
          <BookingForm
            booking={selectedBooking}
            guests={guests}
            amenities={userCompany?.amenities || []}
            onSubmit={handleBookingSubmit}
            onClose={() => {
              setShowBookingForm(false);
              setSelectedBooking(null);
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default ServiceBookingCalendar;