import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './Analytics.css';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell
} from 'recharts';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await axios.get('/api/analytics/overview', { timeout: 5000 });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      if (error.response?.status === 403) {
        toast.error('Admin access required');
      } else {
        toast.error('Error loading analytics. Please check your backend connection.');
      }
      setAnalytics({ overview: {}, eventsByCategory: [], recentBookings: [], topEvents: [], latestActivities: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

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

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} exported successfully!`);
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Error exporting data');
    }
  };

  const handleExportAttendees = async (eventId, eventTitle) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/analytics/export/attendees/${eventId}`, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      // Clean filename for Windows safety
      const safeTitle = eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.setAttribute('download', `attendees_${safeTitle}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Attendee list for ${eventTitle} exported!`);
    } catch (error) {
      console.error('Error exporting attendees:', error);
      toast.error('Error exporting attendee list');
    }
  };

  const handleDownloadFullReport = async () => {
    const element = document.getElementById('analytics-content');
    if (!element) return;

    setLoading(true);
    toast.info('Generating professional PDF report...');

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#f5f5f5'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Financial-Report-${new Date().toLocaleDateString()}.pdf`);
      toast.success('Professional Report Downloaded!');
    } catch (error) {
      console.error('PDF Error:', error);
      toast.error('Failed to generate PDF report');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading analytics Dashboard...</div>;
  }

  if (!analytics) {
    return (
      <div className="analytics-page">
        <div className="container">
          <div className="no-data">No analytics data available.</div>
        </div>
      </div>
    );
  }

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#0088fe', '#00C49F', '#FFBB28'];

  const recentBookings = analytics.recentBookings || [];
  const bookingTrendData = [...recentBookings].reverse().map(item => ({
    date: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    count: item.count
  }));

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
            <button onClick={() => handleExport('financials')} className="btn btn-export btn-finance">
              💰 Export Financials
            </button>
            <button onClick={handleDownloadFullReport} className="btn btn-report-premium">
              📄 Download PDF Report
            </button>
          </div>
        </div>

        <div id="analytics-content">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🎉</div>
              <div className="stat-info">
                <h3>{analytics.overview?.totalEvents || 0}</h3>
                <p>Total Events</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>{analytics.overview?.totalUsers || 0}</h3>
                <p>Total Users</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🎫</div>
              <div className="stat-info">
                <h3>{analytics.overview?.totalBookings || 0}</h3>
                <p>Total Bookings</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <h3>₹{parseFloat(analytics.overview?.totalRevenue || 0).toLocaleString()}</h3>
                <p>Total Revenue</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">💸</div>
              <div className="stat-info">
                <h3>₹{parseFloat(analytics.overview?.totalExpenses || 0).toLocaleString()}</h3>
                <p>Total Expenses</p>
              </div>
            </div>

            <div className="stat-card profit-card">
              <div className="stat-icon">📈</div>
              <div className="stat-info">
                <h3 className={analytics.overview?.totalProfit >= 0 ? 'text-success' : 'text-danger'}>
                  ₹{parseFloat(analytics.overview?.totalProfit || 0).toLocaleString()}
                </h3>
                <p>Net Profit</p>
              </div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <h2>📅 Booking Trends (Last 7 Days)</h2>
              <div style={{ width: '100%', height: 300 }}>
                {bookingTrendData.length > 0 ? (
                  <ResponsiveContainer>
                    <LineChart data={bookingTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} name="Bookings" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="no-chart-data">No trend data available</div>
                )}
              </div>
            </div>

            <div className="chart-card">
              <h2>🏷️ Events by Category</h2>
              <div style={{ width: '100%', height: 300 }}>
                {analytics.eventsByCategory?.length > 0 ? (
                  <ResponsiveContainer>
                    <BarChart data={analytics.eventsByCategory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#82ca9d" name="Events Count">
                        {analytics.eventsByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="no-chart-data">No category data available</div>
                )}
              </div>
            </div>

            <div className="chart-card full-width activity-feed-card">
              <h2>⚡ Recent Activity Feed</h2>
              <div className="activity-list">
                {analytics.latestActivities && analytics.latestActivities.length > 0 ? (
                  analytics.latestActivities.map((activity) => (
                    <div key={activity.id} className="activity-item">
                      <div className="activity-icon">🔔</div>
                      <div className="activity-content">
                        <p>
                          <strong>{activity.user_name}</strong> booked a ticket for <strong>{activity.event_title}</strong>
                        </p>
                        <span className="activity-time">
                          {new Date(activity.created_at).toLocaleString()}
                        </span>
                      </div>
                      <span className={`activity-status ${activity.status}`}>
                        {activity.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="no-activity">No recent activity found.</div>
                )}
              </div>
            </div>

            <div className="chart-card full-width">
              <h2>🏆 Top Performing Events</h2>
              <div className="top-events-table-container">
                <table className="top-events-table">
                  <thead>
                    <tr>
                      <th>Event Title</th>
                      <th>Bookings</th>
                      <th>Revenue</th>
                      <th>Expenses</th>
                      <th>Profit</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topEvents && analytics.topEvents.length > 0 ? (
                      analytics.topEvents.map((event) => (
                        <tr key={event.id}>
                          <td>{event.title}</td>
                          <td>{event.bookings_count}</td>
                          <td>₹{parseFloat(event.revenue || 0).toLocaleString()}</td>
                          <td>₹{parseFloat(event.expenses || 0).toLocaleString()}</td>
                          <td className={event.profit >= 0 ? 'text-success' : 'text-danger'}>
                            ₹{parseFloat(event.profit || 0).toLocaleString()}
                          </td>
                          <td>
                            <button
                              onClick={() => handleExportAttendees(event.id, event.title)}
                              className="btn-action-small"
                              title="Download Attendee List"
                            >
                              📂 CSV
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5">No performance data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
