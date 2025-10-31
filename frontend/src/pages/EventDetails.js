import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Reviews from '../components/Reviews';
import './EventDetails.css';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [numberOfTickets, setNumberOfTickets] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const response = await axios.get(`/api/events/${id}`);
      setEvent(response.data);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Event not found');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      toast.error('Please login to book tickets');
      navigate('/login');
      return;
    }

    setBookingLoading(true);

    try {
      const response = await axios.post('/api/bookings', {
        eventId: id,
        numberOfTickets
      });
      
      toast.success(`Booking successful! Total cost: ₹${response.data.totalCost}`);
      navigate('/bookings');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading event details...</div>;
  }

  if (!event) {
    return null;
  }

  const totalCost = event.price * numberOfTickets;

  // Different images for different categories
  const getCategoryImage = (category) => {
    const images = {
      'Technology': 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800',
      'Entertainment': 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=800',
      'Education': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800',
      'Sports': 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800',
      'Business': 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800',
      'Arts': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800'
    };
    return images[category] || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800';
  };

  return (
    <div className="event-details-page">
      <div className="container">
        <div className="event-detail-card">
          <div className="event-detail-image">
            <img src={event.image_url || getCategoryImage(event.category)} alt={event.title} />
          </div>
          <div className="event-main">
            <h1>{event.title}</h1>
            <div className="event-meta">
              <span className="category-badge">{event.category}</span>
              <span className={`status ${event.status}`}>{event.status}</span>
            </div>
            <p className="event-description">{event.description}</p>
            
            <div className="event-info">
              <div className="info-item">
                <strong>📅 Date & Time:</strong>
                <p>{new Date(event.event_date).toLocaleString()}</p>
              </div>
              <div className="info-item">
                <strong>📍 Location:</strong>
                <p>{event.location}</p>
              </div>
              <div className="info-item">
                <strong>💵 Price per ticket:</strong>
                <p>₹{event.price}</p>
              </div>
              <div className="info-item">
                <strong>👥 Capacity:</strong>
                <p>{event.capacity} people</p>
              </div>
              <div className="info-item">
                <strong>🎫 Organizer:</strong>
                <p>{event.organizer_full_name || event.organizer_name}</p>
              </div>
            </div>
          </div>

          {user && (
            <div className="booking-section">
              <h3>Book Tickets</h3>
              <div className="booking-form">
                <div className="form-group">
                  <label>Number of Tickets</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={numberOfTickets}
                    onChange={(e) => setNumberOfTickets(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="total-cost">
                  <p>Total Cost: <strong>₹{totalCost}</strong></p>
                </div>
                <button
                  onClick={handleBooking}
                  className="btn btn-primary btn-block"
                  disabled={bookingLoading || event.status !== 'active'}
                >
                  {bookingLoading ? 'Booking...' : 'Book Now'}
                </button>
                {event.status !== 'active' && (
                  <p className="booking-note">This event is not available for booking</p>
                )}
              </div>
            </div>
          )}
        </div>
        <Reviews eventId={id} />
      </div>
    </div>
  );
};

export default EventDetails;

