import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import './EventBookings.css';

const EventBookings = () => {
  const { eventId } = useParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState(null);
  const [checkingInId, setCheckingInId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const safeParseSeats = (seats) => {
    if (!seats) return [];
    if (typeof seats === 'object' && Array.isArray(seats)) return seats;
    if (typeof seats === 'object') return []; // Should not happen but for safety

    try {
      // Handle cases where strings might use single quotes or be double-escaped
      const cleanSeats = seats.replace(/'/g, '"').trim();
      return JSON.parse(cleanSeats);
    } catch (e) {
      console.error('Error parsing seats:', e, 'Raw value:', seats);
      return [];
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`/api/bookings/event/${eventId}`);
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Error loading bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const handleReject = async (bookingId) => {
    if (!window.confirm('Are you sure you want to reject this booking?')) {
      return;
    }

    setRejectingId(bookingId);

    try {
      await axios.put(`/api/bookings/${bookingId}/reject`);
      toast.success('Booking rejected successfully');
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error rejecting booking');
    } finally {
      setRejectingId(null);
    }
  };

  const handleCheckIn = async (bookingId) => {
    setCheckingInId(bookingId);
    try {
      await axios.put(`/api/bookings/${bookingId}/check-in`);
      toast.success('Attendee checked-in successfully');
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Check-in failed');
    } finally {
      setCheckingInId(null);
    }
  };

  const filteredBookings = bookings.filter(booking =>
    booking.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.qr_token?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading">Loading bookings...</div>;
  }

  return (
    <div className="event-bookings-page">
      <div className="container">
        <h1>Event Bookings</h1>

        {bookings.length === 0 ? (
          <div className="no-bookings">
            <p>No bookings for this event yet.</p>
          </div>
        ) : (
          <>
            <div className="scanner-search-bar">
              <input
                type="text"
                placeholder="🔍 Search by Name, Email, or QR Token..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="scanner-search-input"
              />
            </div>

            <div className="bookings-list">
              {filteredBookings.length === 0 ? (
                <div className="no-results">No attendees matching "{searchTerm}"</div>
              ) : (
                filteredBookings.map(booking => (
                  <div key={booking.id} className={`booking-card ${booking.check_in_status === 'checked_in' ? 'checked-in-elite' : ''}`}>
                    <div className="booking-header">
                      <div>
                        <h3>{booking.full_name}</h3>
                        <p className="booking-user">{booking.username} • {booking.email}</p>
                      </div>
                      <div className="status-container">
                        <span className={`status ${booking.status}`}>{booking.status}</span>
                        {booking.check_in_status === 'checked_in' && (
                          <span className="check-in-badge">✅ CHECKED IN</span>
                        )}
                      </div>
                    </div>
                    <div className="booking-details">
                      <p><strong>🎫 Tickets:</strong> {booking.number_of_tickets}</p>
                      {booking.selected_seats && (
                        <p><strong>💺 Seats:</strong> <span className="seat-assignments">{safeParseSeats(booking.selected_seats).map(s => {
                          const [r, c] = s.split('-');
                          return `${String.fromCharCode(65 + parseInt(r))}${parseInt(c) + 1}`;
                        }).join(', ')}</span></p>
                      )}
                      <p><strong>💰 Total Cost:</strong> ₹{booking.total_cost}</p>
                      <p><strong>📅 Booked On:</strong> {new Date(booking.created_at).toLocaleString()}</p>
                      <p className="qr-token-display"><strong>Token:</strong> <code>{booking.qr_token || 'N/A'}</code></p>
                    </div>
                    <div className="booking-card-actions">
                      {booking.status === 'confirmed' && booking.check_in_status !== 'checked_in' && (
                        <button
                          onClick={() => handleCheckIn(booking.id)}
                          className="btn btn-primary check-in-btn"
                          disabled={checkingInId === booking.id}
                        >
                          {checkingInId === booking.id ? 'Checking in...' : '🎯 Check-In Attendee'}
                        </button>
                      )}
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => handleReject(booking.id)}
                          className="btn btn-outline-danger"
                          disabled={rejectingId === booking.id}
                        >
                          {rejectingId === booking.id ? 'Rejecting...' : 'Reject Booking'}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EventBookings;

