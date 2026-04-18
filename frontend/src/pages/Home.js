import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Home.css';

const Home = () => {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedEvents();
  }, []);

  const fetchFeaturedEvents = async () => {
    try {
      const response = await axios.get('/api/events');
      // Just take the first 3 active events as featured
      const active = response.data.filter(e => e.status === 'active').slice(0, 3);
      setFeaturedEvents(active);
    } catch (error) {
      console.error('Error fetching featured events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper for images
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
    <div className="home">
      {/* Full-Width Hero Banner */}
      <section className="hero-banner">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">
            Discover & Manage
            <span className="highlight"> Amazing Events</span>
          </h1>
          <p className="hero-subtitle">
            Your all-in-one platform for creating, discovering, and booking incredible events
          </p>
          <div className="hero-buttons">
            <Link to="/events" className="btn btn-primary btn-hero">
              <span>🎉 Browse Events</span>
            </Link>
            <Link to="/register" className="btn btn-secondary btn-hero">
              <span>Get Started Free</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      {!loading && featuredEvents.length > 0 && (
        <section className="featured-events">
          <div className="container">
            <div className="section-header">
              <span className="section-badge">🔥 Hot Now</span>
              <h2>Featured Events</h2>
            </div>
            <div className="events-grid">
              {featuredEvents.map(event => (
                <div key={event.id} className="event-card">
                  <div className="event-card-image">
                    <img src={event.image_url || getCategoryImage(event.category)} alt={event.title} />
                    <span className="category-badge">{event.category}</span>
                  </div>
                  <div className="event-card-content">
                    <h3>{event.title}</h3>
                    <p>{event.description.substring(0, 100)}...</p>
                    <div className="event-meta">
                      <span>📅 {new Date(event.event_date).toLocaleDateString()}</span>
                      <span>💰 ₹{event.price}</span>
                    </div>
                    <Link to={`/events/${event.id}`} className="btn btn-primary btn-block">
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">✨ Benefits</span>
            <h2>Everything You Need</h2>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">🎯</div>
              </div>
              <h3>Waitlist System</h3>
              <p>Never miss out on a full event with our new smart waitlist system.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">💳</div>
              </div>
              <h3>Mock Payments</h3>
              <p>Experience a full checkout flow with our secure mock payment system.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">📊</div>
              </div>
              <h3>Visual Analytics</h3>
              <p>Track performance with our new Recharts-powered admin dashboard.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

