const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');

// Join waitlist
router.post('/:eventId', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.userId;

    // Check if event exists and is not full
    const [events] = await db.query('SELECT capacity, status FROM events WHERE id = ?', [eventId]);
    if (events.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const [bookings] = await db.query('SELECT SUM(number_of_tickets) as total FROM bookings WHERE event_id = ? AND status = "confirmed"', [eventId]);
    const totalBooked = bookings[0].total || 0;

    if (totalBooked < events[0].capacity) {
      return res.status(400).json({ error: 'Event is not full yet. You can book directly.' });
    }

    // Check if user is already on waitlist
    const [existing] = await db.query('SELECT id FROM waitlist WHERE event_id = ? AND user_id = ?', [eventId, userId]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'You are already on the waitlist for this event.' });
    }

    // Join waitlist
    await db.query('INSERT INTO waitlist (event_id, user_id) VALUES (?, ?)', [eventId, userId]);

    // Create notification
    await db.query('INSERT INTO notifications (user_id, event_id, type, message) VALUES (?, ?, "waitlist", ?)',
      [userId, eventId, `You have joined the waitlist for event #${eventId}`]);

    res.status(201).json({ message: 'Successfully joined the waitlist' });
  } catch (error) {
    console.error('Error joining waitlist:', error);
    res.status(500).json({ error: 'Server error joining waitlist' });
  }
});

// Get user's waitlist
router.get('/my-waitlist', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const [list] = await db.query(`
      SELECT w.*, e.title as event_title, e.event_date, e.location, e.category
      FROM waitlist w
      JOIN events e ON w.event_id = e.id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `, [userId]);

    res.json(list);
  } catch (error) {
    console.error('SERVER_ERROR_WAITLIST:', error);
    res.status(500).json({ error: 'Server error fetching waitlist', details: error.message });
  }
});

// Leave waitlist
router.delete('/:eventId', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.userId;

    await db.query('DELETE FROM waitlist WHERE event_id = ? AND user_id = ?', [eventId, userId]);
    res.json({ message: 'Successfully left the waitlist' });
  } catch (error) {
    console.error('Error leaving waitlist:', error);
    res.status(500).json({ error: 'Server error leaving waitlist' });
  }
});

module.exports = router;
