import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './Reviews.css';

const Reviews = ({ eventId }) => {
  const { user } = useContext(AuthContext);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    fetchReviews();
    fetchRating();
  }, [eventId]);

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`/api/reviews/event/${eventId}`);
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRating = async () => {
    try {
      const response = await axios.get(`/api/reviews/event/${eventId}/rating`);
      setAverageRating(response.data.averageRating);
      setTotalReviews(response.data.totalReviews);
    } catch (error) {
      console.error('Error fetching rating:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to submit a review');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);

    try {
      await axios.post('/api/reviews', {
        eventId,
        rating,
        comment
      });
      
      toast.success('Review submitted successfully!');
      setRating(0);
      setComment('');
      fetchReviews();
      fetchRating();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error submitting review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating, interactive = false, onRate = null) => {
    return (
      <div className={`stars ${interactive ? 'interactive' : ''}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : ''}`}
            onClick={interactive && onRate ? () => onRate(star) : undefined}
          >
            ⭐
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="reviews-section">
      <div className="reviews-header">
        <h3>Reviews & Ratings</h3>
        {totalReviews > 0 && (
          <div className="rating-summary">
            <span className="average-rating">{averageRating.toFixed(1)}</span>
            {renderStars(Math.round(averageRating))}
            <span className="total-reviews">({totalReviews} reviews)</span>
          </div>
        )}
      </div>

      {user && user.role !== 'admin' && (
        <form onSubmit={handleSubmit} className="review-form">
          <div className="form-group">
            <label>Your Rating</label>
            {renderStars(rating, true, setRating)}
          </div>
          <div className="form-group">
            <label>Your Review</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              rows="3"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="loading">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="no-reviews">No reviews yet. Be the first to review!</div>
      ) : (
        <div className="reviews-list">
          {reviews.map(review => (
            <div key={review.id} className="review-card">
              <div className="review-header">
                <div>
                  <h4>{review.full_name || review.username}</h4>
                  <p>{new Date(review.created_at).toLocaleDateString()}</p>
                </div>
                {renderStars(review.rating)}
              </div>
              {review.comment && <p className="review-comment">{review.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reviews;

