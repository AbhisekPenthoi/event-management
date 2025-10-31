import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './MyEvents.css';

const MyEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      const response = await axios.get('/api/events/my-events');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Error loading your events');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    setProcessingId(eventId);

    try {
      await axios.delete(`/api/events/${eventId}`);
      toast.success('Event deleted successfully');
      fetchMyEvents();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete event');
    } finally {
      setProcessingId(null);
    }
  };

  const handleClose = async (eventId) => {
    if (!window.confirm('Are you sure you want to close this event? No more bookings will be accepted.')) {
      return;
    }

    setProcessingId(eventId);

    try {
      await axios.put(`/api/events/${eventId}/close`);
      toast.success('Event closed successfully');
      fetchMyEvents();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to close event');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="loading">Loading your events...</div>;
  }

  return (
    <div className="my-events-page">
      <div className="container">
        <div className="page-header">
          <h1>My Events</h1>
          <button onClick={() => navigate('/create-event')} className="btn btn-primary">
            ➕ Create New Event
          </button>
        </div>

        {events.length === 0 ? (
          <div className="no-events">
            <p>You haven't created any events yet.</p>
            <button onClick={() => navigate('/create-event')} className="btn btn-primary">
              Create Your First Event
            </button>
          </div>
        ) : (
          <div className="events-grid">
            {events.map(event => (
              <div key={event.id} className="event-card">
                <div className="event-header">
                  <h3>{event.title}</h3>
                  <span className={`status ${event.status}`}>{event.status}</span>
                </div>
                <p className="event-description">
                  {event.description.length > 100 ? `${event.description.substring(0, 100)}...` : event.description}
                </p>
                <div className="event-details">
                  <p><strong>📅 Date:</strong> {new Date(event.event_date).toLocaleString()}</p>
                  <p><strong>📍 Location:</strong> {event.location}</p>
                  <p><strong>🏷️ Category:</strong> {event.category}</p>
                  <p><strong>💰 Price:</strong> ₹{event.price}</p>
                  <p><strong>👥 Capacity:</strong> {event.capacity}</p>
                </div>
                <div className="event-actions">
                  <div className="action-row">
                    <Link to={`/events/${event.id}`} className="btn btn-secondary btn-small">
                      View
                    </Link>
                    <Link to={`/edit-event/${event.id}`} className="btn btn-primary btn-small">
                      Edit
                    </Link>
                    <Link to={`/event-bookings/${event.id}`} className="btn btn-info btn-small">
                      Bookings
                    </Link>
                  </div>
                  <div className="action-row">
                    {event.status === 'active' && (
                      <button
                        onClick={() => handleClose(event.id)}
                        className="btn btn-warning btn-small"
                        disabled={processingId === event.id}
                      >
                        {processingId === event.id ? 'Processing...' : 'Close'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="btn btn-danger btn-small"
                      disabled={processingId === event.id}
                    >
                      {processingId === event.id ? 'Processing...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyEvents;

