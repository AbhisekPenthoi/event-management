import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Events.css';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'calendar'
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('/api/events', { timeout: 5000 });
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Error loading events. Please check your connection.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const getEventsForDate = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dayEvents = getEventsForDate(date);
      if (dayEvents.length > 0) {
        return (
          <div className="calendar-tile-content">
            <div className="event-dot"></div>
          </div>
        );
      }
    }
    return null;
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
          <div className="filter-controls">
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
          <div className="view-toggle">
            <button
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
            >
              📱 Grid
            </button>
            <button
              className={viewMode === 'calendar' ? 'active' : ''}
              onClick={() => setViewMode('calendar')}
            >
              📅 Calendar
            </button>
          </div>
        </div>

        {viewMode === 'calendar' ? (
          <div className="calendar-view-container">
            <div className="calendar-sidebar">
              <h3>Events on {selectedDate.toLocaleDateString()}</h3>
              <div className="selected-date-events">
                {getEventsForDate(selectedDate).length === 0 ? (
                  <p className="no-events-day">No events scheduled for this day.</p>
                ) : (
                  getEventsForDate(selectedDate).map(event => (
                    <Link to={`/events/${event.id}`} key={event.id} className="sidebar-event-card">
                      <div className="sidebar-event-time">
                        {new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="sidebar-event-details">
                        <h4>{event.title}</h4>
                        <span className="sidebar-category">{event.category}</span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
            <div className="calendar-main">
              <Calendar
                onChange={setSelectedDate}
                value={selectedDate}
                tileContent={tileContent}
                className="custom-calendar"
              />
            </div>
          </div>
        ) : filteredEvents.length === 0 ? (
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

