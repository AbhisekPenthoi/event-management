import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Analytics.css';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('/api/analytics/overview');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Error loading analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  if (!analytics) {
    return null;
  }

  const handleExport = async (type) => {
    try {
      const response = await axios.get(`/api/analytics/export/${type}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`${type === 'bookings' ? 'Bookings' : 'Users'} exported successfully!`);
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Error exporting data');
    }
  };

  return (
    <div className="analytics-page">
      <div className="container">
        <div className="page-header-analytics">
          <h1>📊 Analytics Dashboard</h1>
          <div className="export-buttons">
            <button onClick={() => handleExport('bookings')} className="btn btn-export">
              📥 Export Bookings
            </button>
            <button onClick={() => handleExport('users')} className="btn btn-export">
              📥 Export Users
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🎉</div>
            <div className="stat-info">
              <h3>{analytics.overview.totalEvents}</h3>
              <p>Total Events</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>{analytics.overview.totalUsers}</h3>
              <p>Total Users</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🎫</div>
            <div className="stat-info">
              <h3>{analytics.overview.totalBookings}</h3>
              <p>Total Bookings</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <h3>₹{parseFloat(analytics.overview.totalRevenue || 0).toFixed(2)}</h3>
              <p>Total Revenue</p>
            </div>
          </div>
        </div>

        <div className="charts-grid">
          <div className="chart-card">
            <h2>Events by Category</h2>
            <div className="category-list">
              {analytics.eventsByCategory && analytics.eventsByCategory.map((item, index) => (
                <div key={index} className="category-item">
                  <div className="category-bar">
                    <span className="category-name">{item.category}</span>
                    <span className="category-count">{item.count}</span>
                  </div>
                  <div className="category-bar-bg">
                    <div 
                      className="category-bar-fill" 
                      style={{ width: `${(item.count / (analytics.overview.totalEvents || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <h2>Top Events by Bookings</h2>
            <div className="top-events-list">
              {analytics.topEvents && analytics.topEvents.map((event, index) => (
                <div key={event.id} className="top-event-item">
                  <span className="event-rank">#{index + 1}</span>
                  <div className="event-details">
                    <h4>{event.title}</h4>
                    <p>{event.bookings_count || 0} bookings • ₹{parseFloat(event.revenue || 0).toFixed(2)} revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

