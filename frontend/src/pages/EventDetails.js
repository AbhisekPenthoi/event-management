import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Reviews from '../components/Reviews';
import SeatingMap from '../components/SeatingMap';
import LiveStage from '../components/LiveStage';
import './EventDetails.css';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [numberOfTickets, setNumberOfTickets] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [isWaitlisted, setIsWaitlisted] = useState(false);
  const [bookedCount, setBookedCount] = useState(0);
  const [selectedSeats, setSelectedSeats] = useState([]);

  // Social Proof Engine (Simulated Real-time)
  useEffect(() => {
    if (!event) return;

    const messages = [
      `🔥 12 people are currently viewing this event`,
      `✨ Just booked! Someone from ${['London', 'Mumbai', 'New York', 'Tokyo', 'Berlin'][Math.floor(Math.random() * 5)]} just secured a spot.`,
      `⚡ Only a few VIP tickets remaining!`,
      `🙌 156 people have added this to their favorites`,
    ];

    const showSocialProof = () => {
      const msg = messages[Math.floor(Math.random() * messages.length)];
      toast.info(msg, {
        position: "bottom-left",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
      });
    };

    const timer = setInterval(() => {
      if (Math.random() > 0.7) showSocialProof();
    }, 15000);

    return () => clearInterval(timer);
  }, [event]);

  const fetchEventDetails = useCallback(async () => {
    try {
      const response = await axios.get(`/api/events/${id}`, { timeout: 5000 });
      setEvent(response.data);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Event not found or server error');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchEventDetails();
  }, [fetchEventDetails]);

  const fetchWaitlistStatus = useCallback(async () => {
    if (!user) return;
    try {
      const response = await axios.get('/api/waitlist/my-waitlist', { timeout: 3000 });
      const waitlisted = response.data.some(item => item.event_id === parseInt(id));
      setIsWaitlisted(waitlisted);
    } catch (error) {
      console.error('Error fetching waitlist status:', error);
    }
  }, [id, user]);

  const fetchBookingsCount = useCallback(async () => {
    try {
      const response = await axios.get(`/api/bookings/event/${id}/count`, { timeout: 3000 });
      setBookedCount(response.data.count || 0);
    } catch (error) {
      console.error('Error fetching bookings count:', error);
    }
  }, [id]);

  useEffect(() => {
    if (event) {
      fetchWaitlistStatus();
      fetchBookingsCount();
    }
  }, [event, fetchWaitlistStatus, fetchBookingsCount]);

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
        numberOfTickets: event.has_seating ? selectedSeats.length : numberOfTickets,
        selectedSeats: event.has_seating ? selectedSeats : null
      });

      toast.success(`Booking initiated! Complete payment to confirm.`);
      navigate(`/checkout/${response.data.bookingId}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleWaitlist = async () => {
    if (!user) {
      toast.error('Please login to join waitlist');
      navigate('/login');
      return;
    }

    setWaitlistLoading(true);
    try {
      if (isWaitlisted) {
        await axios.delete(`/api/waitlist/${id}`);
        toast.success('Left waitlist successfully');
        setIsWaitlisted(false);
      } else {
        await axios.post(`/api/waitlist/${id}`);
        toast.success('Joined waitlist successfully');
        setIsWaitlisted(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Waitlist action failed');
    } finally {
      setWaitlistLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading event details...</div>;
  }

  if (!event) {
    return null;
  }

  const getSeatingConfig = () => {
    if (!event) return null;
    return event.seating_config && event.seating_config.rows ? event.seating_config : {
      rows: Math.ceil(Math.sqrt(event.capacity || 100)),
      cols: Math.ceil(Math.sqrt(event.capacity || 100)),
      vip_rows: [0, 1],
      vip_price_multiplier: 1.5
    };
  };

  const calculateTotalCost = () => {
    if (!event) return 0;
    if (!event.has_seating) {
      return Number(event.price) * numberOfTickets;
    }

    const config = getSeatingConfig();
    let cost = 0;
    const basePrice = Number(event.price);
    selectedSeats.forEach(seatKey => {
      const [r] = seatKey.split('-').map(Number);
      const isVip = config.vip_rows?.includes(r);
      const seatPrice = isVip ? basePrice * (config.vip_price_multiplier || 1.5) : basePrice;
      cost += Number(seatPrice);
    });
    return cost;
  };

  const totalCost = calculateTotalCost();

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

  const themeClass = `theme-${event.category?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`event-details-page ${themeClass}`}>
      <div className="container">
        <div className="event-detail-card">
          <div className="event-detail-image">
            <img src={event.image_url || getCategoryImage(event.category)} alt={event.title} />
            <div className={`banner-overlay-elite ${themeClass}`}></div>
            {event.category?.toLowerCase() === 'technology' && <div className="cyber-grid-overlay"></div>}
            {(event.category?.toLowerCase() === 'music' || event.category?.toLowerCase() === 'entertainment') && <div className="music-glow-overlay"></div>}
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
                <p>₹{event.price || 0}</p>
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
              {bookedCount >= event.capacity ? (
                <div className="waitlist-container">
                  <div className="full-badge">Event Full 🚫</div>
                  <p className="waitlist-note">Join our waitlist to be notified if spots open up!</p>
                  <button
                    onClick={handleWaitlist}
                    className={`btn ${isWaitlisted ? 'btn-secondary' : 'btn-primary'} btn-block`}
                    disabled={waitlistLoading || event.status !== 'active'}
                  >
                    {waitlistLoading ? 'Processing...' : (isWaitlisted ? 'Leave Waitlist' : 'Join Waitlist')}
                  </button>
                </div>
              ) : (
                <>
                  <h3>Book Tickets</h3>
                  <div className="booking-form">
                    {event.has_seating ? (
                      <div className="seating-selection-area">
                        <h3>Select Your Seats</h3>
                        <SeatingMap
                          config={getSeatingConfig()}
                          selectedSeats={selectedSeats}
                          onSeatSelect={setSelectedSeats}
                        />
                        <p className="selected-summary">
                          Selected: {selectedSeats.length} seats (
                          {selectedSeats.map(s => {
                            const [r, c] = s.split('-');
                            return `${String.fromCharCode(65 + parseInt(r))}${parseInt(c) + 1}`;
                          }).join(', ')})
                        </p>
                      </div>
                    ) : (
                      <div className="form-group">
                        <label>Number of Tickets</label>
                        <input
                          type="number"
                          min="1"
                          max={Math.min(10, event.capacity - bookedCount)}
                          value={numberOfTickets}
                          onChange={(e) => setNumberOfTickets(parseInt(e.target.value) || 1)}
                        />
                        <small className="availability-note">
                          {event.capacity - bookedCount} tickets available
                        </small>
                      </div>
                    )}
                    <div className="total-cost">
                      {event.has_seating && selectedSeats.length > 0 && (
                        <div className="price-breakdown">
                          {(() => {
                            const config = getSeatingConfig();
                            let vipCount = 0;
                            let stdCount = 0;
                            selectedSeats.forEach(s => {
                              const r = parseInt(s.split('-')[0]);
                              if (config.vip_rows.includes(r)) vipCount++;
                              else stdCount++;
                            });
                            const vipPrice = event.price * (config.vip_price_multiplier || 1.5);
                            return (
                              <div className="breakdown-details">
                                {stdCount > 0 && <span>{stdCount}x Standard (₹{event.price})</span>}
                                {vipCount > 0 && <span>{vipCount}x VIP (₹{vipPrice})</span>}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                      <p>Total Cost: <strong>₹{totalCost.toFixed(2)}</strong></p>
                    </div>
                    <button
                      onClick={handleBooking}
                      className="btn btn-primary btn-block"
                      disabled={bookingLoading || event.status !== 'active' || (event.has_seating && selectedSeats.length === 0)}
                    >
                      {bookingLoading ? 'Booking...' : (event.has_seating ? 'Book Selected Seats' : 'Book Now')}
                    </button>
                  </div>
                </>
              )}
              {event.status !== 'active' && (
                <p className="booking-note">This event is not available for booking</p>
              )}
            </div>
          )}
        </div>

        <div className="event-extra-grid">
          <div className="extra-main">
            <LiveStage eventId={id} />
          </div>
          <div className="extra-side">
            <Reviews eventId={id} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;

