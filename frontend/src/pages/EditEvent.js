import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import ImageUpload from '../components/ImageUpload';
import './CreateEvent.css';

const EditEvent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
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
    organizer_name: ''
  });

  const categories = ['Technology', 'Entertainment', 'Education', 'Sports', 'Business', 'Arts', 'Other'];

  const fetchEventDetails = async () => {
    try {
      const response = await axios.get(`/api/events/${id}`);
      const event = response.data;
      setFormData({
        title: event.title,
        description: event.description,
        eventDate: event.event_date.replace('T', ' ').substring(0, 16),
        location: event.location,
        category: event.category,
        price: event.price,
        capacity: event.capacity,
        image_url: event.image_url || '',
        organizer_name: event.organizer_name || ''
      });
    } catch (error) {
      toast.error('Error loading event details');
      navigate('/my-events');
    }
  };

  useEffect(() => {
    fetchEventDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
      await axios.put(`/api/events/${id}`, formData);
      toast.success('Event updated successfully!');
      navigate('/my-events');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-event-page">
      <div className="container">
        <h1>Edit Event</h1>
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
                  <small style={{color: '#666', fontSize: '0.9rem'}}>
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

            <div className="form-actions">
              <button type="button" onClick={() => navigate('/my-events')} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Updating...' : 'Update Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditEvent;

