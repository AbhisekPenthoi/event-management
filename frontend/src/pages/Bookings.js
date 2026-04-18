import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Bookings.css';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await axios.get('/api/bookings');
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Error loading bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    setCancellingId(bookingId);

    try {
      await axios.put(`/api/bookings/${bookingId}/cancel`);
      toast.success('Booking cancelled successfully');
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error cancelling booking');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return <div className="loading">Loading your bookings...</div>;
  }

  return (
    <div className="bookings-page">
      <div className="container">
        <h1>My Bookings</h1>

        {bookings.length === 0 ? (
          <div className="no-bookings">
            <p>You haven't made any bookings yet.</p>
            <Link to="/events" className="btn btn-primary">Browse Events</Link>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map(booking => (
              <div key={booking.id} className="booking-card">
                <div className="booking-header">
                  <h3>{booking.event_title}</h3>
                  <span className={`status ${booking.status}`}>{booking.status}</span>
                </div>
                <div className="booking-details">
                  <p><strong>📅 Event Date:</strong> {new Date(booking.event_date).toLocaleString()}</p>
                  <p><strong>📍 Location:</strong> {booking.location}</p>
                  <p><strong>🎫 Tickets:</strong> {booking.number_of_tickets}</p>
                  <p><strong>💰 Total Cost:</strong> ₹{booking.total_cost}</p>
                  <p><strong>💳 Payment:</strong>
                    <span className={`payment-status payment-${booking.payment_status}`}>
                      {booking.payment_status || 'paid'}
                    </span>
                  </p>
                  <p><strong>📅 Booked On:</strong> {new Date(booking.created_at).toLocaleString()}</p>
                </div>
                {booking.status === 'confirmed' && (
                  <div className="booking-actions">
                    <Link to={`/ticket/${booking.id}`} className="btn btn-primary">
                      🎫 View Ticket
                    </Link>
                    {new Date(booking.event_date) < new Date() && (
                      <Link to={`/certificate/${booking.id}`} className="btn btn-success" style={{ marginLeft: '10px' }}>
                        🎓 Download Certificate
                      </Link>
                    )}
                    <button
                      onClick={() => handleCancel(booking.id)}
                      className="btn btn-danger"
                      disabled={cancellingId === booking.id}
                      style={{ marginLeft: '10px' }}
                    >
                      {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;

