import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
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

      {/* Features Section with Better Visuals */}
      <section className="features">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">✨ Features</span>
            <h2>Everything You Need to Manage Events</h2>
            <p className="section-subtitle">Powerful features to create, discover, and book events seamlessly</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">🎯</div>
              </div>
              <h3>Discover Events</h3>
              <p>Find amazing events happening near you with powerful search and filters</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">🎫</div>
              </div>
              <h3>Easy Booking</h3>
              <p>Book tickets for your favorite events in seconds with one-click booking</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">📅</div>
              </div>
              <h3>Manage Bookings</h3>
              <p>Keep track of all your event bookings and manage them in one place</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">🔒</div>
              </div>
              <h3>Secure Platform</h3>
              <p>Safe and secure platform with encrypted transactions and data protection</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">📊</div>
              </div>
              <h3>Analytics</h3>
              <p>Track your event performance with detailed analytics and insights</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">🌐</div>
              </div>
              <h3>Global Reach</h3>
              <p>Reach audiences worldwide with our multi-city event platform</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="cta-content">
          <h2>Ready to Get Started?</h2>
          <p>Join thousands of users creating and discovering amazing events</p>
          <Link to="/register" className="btn btn-primary btn-large btn-cta">
            Create Your Free Account →
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;

