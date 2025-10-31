import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Events.css';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('/api/events');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(events.map(e => e.category))];

  if (loading) {
    return <div className="loading">Loading events...</div>;
  }

  return (
    <div className="events-page">
      <div className="container">
        <h1>All Events</h1>
        
        <div className="filters">
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="category-filter"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {filteredEvents.length === 0 ? (
          <p className="no-events">No events found.</p>
        ) : (
          <div className="events-grid">
            {filteredEvents.map((event, index) => {
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
                <div key={event.id} className="event-card">
                  <div className="event-card-image">
                    <img src={event.image_url || getCategoryImage(event.category)} alt={event.title} />
                    <span className="category-badge">{event.category}</span>
                    <span className={`status ${event.status}`}>{event.status}</span>
                  </div>
                  <div className="event-card-header">
                    <div className="event-header">
                      <h3>{event.title}</h3>
                    </div>
                  </div>
                  <div className="event-card-content">
                    <p className="event-description">{event.description}</p>
                    <div className="event-details">
                      <p><strong>📅 Date:</strong> {new Date(event.event_date).toLocaleString()}</p>
                      <p><strong>📍 Location:</strong> {event.location}</p>
                      <p><strong>💰 Price:</strong> <span className="event-price">₹{event.price}</span></p>
                    </div>
                  </div>
                  <div className="event-card-footer">
                    <Link to={`/events/${event.id}`} className="btn btn-primary btn-block">
                      View Details →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;

