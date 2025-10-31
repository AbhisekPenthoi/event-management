const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');

// Get all reviews for an event
router.get('/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const [reviews] = await db.query(`
      SELECT r.*, u.username, u.full_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.event_id = ?
      ORDER BY r.created_at DESC
    `, [eventId]);
    
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Server error fetching reviews' });
  }
});

// Get average rating for an event
router.get('/event/:eventId/rating', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const [result] = await db.query(`
      SELECT AVG(rating) as average_rating, COUNT(*) as total_reviews
      FROM reviews
      WHERE event_id = ?
    `, [eventId]);
    
    res.json({
      averageRating: result[0].average_rating || 0,
      totalReviews: result[0].total_reviews || 0
    });
  } catch (error) {
    console.error('Error fetching rating:', error);
    res.status(500).json({ error: 'Server error fetching rating' });
  }
});

// Create or update review (Users only, not admins)
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    const { eventId, rating, comment } = req.body;

    // Admins cannot review events
    if (role === 'admin') {
      return res.status(403).json({ error: 'Admins cannot review events' });
    }

    if (!eventId || !rating) {
      return res.status(400).json({ error: 'Event ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if review already exists
    const [existing] = await db.query(
      'SELECT * FROM reviews WHERE event_id = ? AND user_id = ?',
      [eventId, userId]
    );

    if (existing.length > 0) {
      // Update existing review
      await db.query(
        'UPDATE reviews SET rating = ?, comment = ?, updated_at = NOW() WHERE id = ?',
        [rating, comment || null, existing[0].id]
      );
      res.json({ message: 'Review updated successfully' });
    } else {
      // Create new review
      await db.query(
        'INSERT INTO reviews (event_id, user_id, rating, comment, created_at) VALUES (?, ?, ?, ?, NOW())',
        [eventId, userId, rating, comment || null]
      );
      res.status(201).json({ message: 'Review created successfully' });
    }
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Server error creating review' });
  }
});

// Delete review
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if review exists and belongs to user
    const [reviews] = await db.query('SELECT * FROM reviews WHERE id = ? AND user_id = ?', [id, userId]);
    
    if (reviews.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    await db.query('DELETE FROM reviews WHERE id = ?', [id]);
    
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Server error deleting review' });
  }
});

module.exports = router;

