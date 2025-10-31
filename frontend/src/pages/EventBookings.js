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
          <div className="bookings-list">
            {bookings.map(booking => (
              <div key={booking.id} className="booking-card">
                <div className="booking-header">
                  <div>
                    <h3>{booking.full_name}</h3>
                    <p className="booking-user">{booking.username} • {booking.email}</p>
                  </div>
                  <span className={`status ${booking.status}`}>{booking.status}</span>
                </div>
                <div className="booking-details">
                  <p><strong>🎫 Tickets:</strong> {booking.number_of_tickets}</p>
                  <p><strong>💰 Total Cost:</strong> ₹{booking.total_cost}</p>
                  <p><strong>📅 Booked On:</strong> {new Date(booking.created_at).toLocaleString()}</p>
                  {booking.payment_status && (
                    <p><strong>💳 Payment:</strong> 
                      <span className={`payment-status payment-${booking.payment_status}`}>
                        {booking.payment_status || 'paid'}
                      </span>
                    </p>
                  )}
                </div>
                {booking.status === 'confirmed' && (
                  <button
                    onClick={() => handleReject(booking.id)}
                    className="btn btn-danger"
                    disabled={rejectingId === booking.id}
                  >
                    {rejectingId === booking.id ? 'Rejecting...' : 'Reject Booking'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventBookings;

