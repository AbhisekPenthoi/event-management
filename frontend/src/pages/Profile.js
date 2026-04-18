import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { QRCodeSVG } from 'qrcode.react';
import './Profile.css';

const Profile = () => {
  useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    fullName: ''
  });
  const [bookings, setBookings] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const fetchBookings = async () => {
    try {
      const response = await axios.get('/api/bookings');
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/users/profile');
      setUser(response.data);
      setFormData({
        username: response.data.username,
        fullName: response.data.full_name || response.data.fullName
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchBookings();
  }, []);

  const closeTicketModal = () => setSelectedTicket(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await axios.put('/api/users/profile', formData);
      toast.success('Profile updated successfully');
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  // Redundant local PDF generation removed in favor of dedicated Certificate page.

  const pastBookings = bookings.filter(b => new Date(b.event_date) < new Date() && b.status === 'confirmed');

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="profile-page">
      <div className="container">
        <h1>My Profile</h1>

        <div className="profile-card">
          <div className="profile-info">
            <div className="profile-avatar">
              <span>{user.username.charAt(0).toUpperCase()}</span>
            </div>
            <div className="profile-details">
              <h3>{user.full_name || user.fullName}</h3>
              <p className="profile-role">{user.role.toUpperCase()}</p>
              <p className="profile-email">{user.email}</p>
              <p className="profile-joined">
                Member since {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Update Profile'}
            </button>
          </form>
        </div>

        {pastBookings.length > 0 && (
          <div className="achievements-section">
            <h2>My Achievements & Certificates</h2>
            <div className="certificates-grid">
              {pastBookings.map(booking => (
                <div key={booking.id} className="certificate-card">
                  <div className="cert-info">
                    <h4>{booking.event_title}</h4>
                    <p>{new Date(booking.event_date).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => window.open(`/certificate/${booking.id}`, '_blank')}
                    className="btn-cert"
                  >
                    📜 View Premium Certificate
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bookings-section">
          <h2>My Upcoming Events</h2>
          <div className="bookings-grid">
            {bookings.filter(b => new Date(b.event_date) >= new Date() && b.status === 'confirmed').map(booking => (
              <div key={booking.id} className="booking-card elite-card">
                <div className="booking-info">
                  <h4>{booking.event_title}</h4>
                  <p>📅 {new Date(booking.event_date).toLocaleDateString()}</p>
                  <p>📍 {booking.location}</p>
                </div>
                <div className="booking-actions">
                  <button
                    className="btn btn-outline"
                    onClick={() => setSelectedTicket(booking)}
                  >
                    🎟️ View Digital Ticket
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedTicket && (
          <div className="ticket-modal-overlay" onClick={closeTicketModal}>
            <div className="ticket-modal" onClick={e => e.stopPropagation()}>
              <button className="close-modal" onClick={closeTicketModal}>&times;</button>
              <div className="ticket-header">
                <h3>Digital Entry Ticket</h3>
                <p>{selectedTicket.event_title}</p>
              </div>
              <div className="qr-container">
                <QRCodeSVG
                  value={selectedTicket.qr_token || `booking-${selectedTicket.id}`}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="ticket-details">
                <p><strong>Attendee:</strong> {user.full_name || user.fullName}</p>
                <p><strong>Date:</strong> {new Date(selectedTicket.event_date).toLocaleString()}</p>
                <p><strong>Location:</strong> {selectedTicket.location}</p>
                <p className="ticket-id">ID: {selectedTicket.qr_token || selectedTicket.id}</p>
              </div>
              <p className="ticket-footer">Present this QR code at the entrance for check-in.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;

