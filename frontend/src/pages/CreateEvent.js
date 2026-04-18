import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ImageUpload from '../components/ImageUpload';
import './CreateEvent.css';

const CreateEvent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageTab, setImageTab] = useState('upload'); // 'upload' or 'url'
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDate: '',
    location: '',
    category: 'Technology',
    price: '',
    capacity: '',
    image_url: '',
    organizer_name: '',
    expenses: '',
    has_seating: false,
    seating_config: {
      rows: 10,
      cols: 10,
      vip_rows: '',
      vip_price_multiplier: 1.5
    }
  });

  const categories = ['Technology', 'Entertainment', 'Education', 'Sports', 'Business', 'Arts', 'Other'];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageUpload = (base64Image) => {
    setFormData({
      ...formData,
      image_url: base64Image
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSubmit = {
        ...formData,
        seating_config: formData.has_seating ? {
          ...formData.seating_config,
          vip_rows: formData.seating_config.vip_rows.split(',').map(r => parseInt(r.trim())).filter(r => !isNaN(r))
        } : null
      };
      await axios.post('/api/events', dataToSubmit);
      toast.success('Event created successfully!');
      navigate('/my-events');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-event-page">
      <div className="container">
        <h1>Create New Event</h1>
        <div className="create-event-card">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Event Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Tech Conference 2024"
                  required
                />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your event..."
                rows="5"
                required
              />
            </div>

            <div className="form-group">
              <label>Event Image (Optional)</label>
              <div className="image-tabs">
                <button
                  type="button"
                  className={`tab-btn ${imageTab === 'upload' ? 'active' : ''}`}
                  onClick={() => setImageTab('upload')}
                >
                  📤 Upload Image
                </button>
                <button
                  type="button"
                  className={`tab-btn ${imageTab === 'url' ? 'active' : ''}`}
                  onClick={() => setImageTab('url')}
                >
                  🔗 Image URL
                </button>
              </div>

              {imageTab === 'upload' ? (
                <ImageUpload onImageChange={handleImageUpload} existingUrl={formData.image_url} />
              ) : (
                <>
                  <input
                    type="url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                  />
                  <small style={{ color: '#666', fontSize: '0.9rem' }}>
                    Leave empty to use default category image
                  </small>
                </>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Event Date & Time *</label>
                <input
                  type="datetime-local"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Location *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Convention Center, Mumbai"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Price per Ticket (₹)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Capacity *</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  placeholder="100"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Organizer Name *</label>
                <input
                  type="text"
                  name="organizer_name"
                  value={formData.organizer_name}
                  onChange={handleChange}
                  placeholder="e.g., John Doe, Tech Corp, etc."
                  required
                />
              </div>
              <div className="form-group">
                <label>Estimated Expenses (₹)</label>
                <input
                  type="number"
                  name="expenses"
                  value={formData.expenses}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div className="seating-config-section">
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="has_seating"
                  name="has_seating"
                  checked={formData.has_seating}
                  onChange={(e) => setFormData({ ...formData, has_seating: e.target.checked })}
                />
                <label htmlFor="has_seating">Enable Venue Seating Map</label>
              </div>

              {formData.has_seating && (
                <div className="seating-details card-inner">
                  <h4>Venue Configuration</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Rows (1-26)</label>
                      <input
                        type="number"
                        value={formData.seating_config.rows}
                        onChange={(e) => setFormData({
                          ...formData,
                          seating_config: { ...formData.seating_config, rows: parseInt(e.target.value) || 1 }
                        })}
                        min="1"
                        max="26"
                      />
                    </div>
                    <div className="form-group">
                      <label>Columns (1-30)</label>
                      <input
                        type="number"
                        value={formData.seating_config.cols}
                        onChange={(e) => setFormData({
                          ...formData,
                          seating_config: { ...formData.seating_config, cols: parseInt(e.target.value) || 1 }
                        })}
                        min="1"
                        max="30"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>VIP Rows (comma separated, e.g., 0,1)</label>
                      <input
                        type="text"
                        value={formData.seating_config.vip_rows}
                        onChange={(e) => setFormData({
                          ...formData,
                          seating_config: { ...formData.seating_config, vip_rows: e.target.value }
                        })}
                        placeholder="0, 1"
                      />
                      <small>Rows are A=0, B=1, etc.</small>
                    </div>
                    <div className="form-group">
                      <label>VIP Price Multiplier</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.seating_config.vip_price_multiplier}
                        onChange={(e) => setFormData({
                          ...formData,
                          seating_config: { ...formData.seating_config, vip_price_multiplier: parseFloat(e.target.value) || 1.0 }
                        })}
                        min="1"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => navigate('/events')} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;

