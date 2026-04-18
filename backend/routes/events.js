const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const db = require('../config/database');

// Get all events
router.get('/', async (req, res) => {
  try {
    const [events] = await db.query(`
      SELECT e.*, u.username as organizer_username, u.email as organizer_email
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      ORDER BY e.event_date DESC
    `);
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Server error fetching events' });
  }
});

// Get user's own events
router.get('/my-events', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const [events] = await db.query(`
      SELECT e.*, u.username as organizer_username, u.email as organizer_email
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      WHERE e.organizer_id = ?
      ORDER BY e.event_date DESC
    `, [userId]);
    res.json(events);
  } catch (error) {
    console.error('Error fetching user events:', error);
    res.status(500).json({ error: 'Server error fetching your events' });
  }
});

// Get single event by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [events] = await db.query(`
      SELECT e.*, u.username as organizer_username, u.email as organizer_email, u.full_name as organizer_full_name
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      WHERE e.id = ?
    `, [id]);

    if (events.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(events[0]);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Server error fetching event' });
  }
});

// Create new event
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      title, description, eventDate, location, category,
      price, capacity, image_url, organizer_name,
      has_seating, seating_config, expenses
    } = req.body;
    const organizerId = req.user.userId;
    const role = req.user.role;

    if (role !== 'admin' && role !== 'organizer') {
      return res.status(403).json({ error: 'Only admins and organizers can create events' });
    }

    if (!title || !description || !eventDate || !location || !category) {
      return res.status(400).json({ error: 'All primary fields are required' });
    }

    const [result] = await db.query(`
      INSERT INTO events (title, description, event_date, location, category, price, capacity, organizer_id, image_url, organizer_name, has_seating, seating_config, expenses, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())
    `, [title, description, eventDate, location, category, price || 0, capacity || 100, organizerId, image_url || null, organizer_name, has_seating || false, JSON.stringify(seating_config) || null, expenses || 0]);

    res.status(201).json({ message: 'Event created successfully', eventId: result.insertId });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Server error creating event' });
  }
});

// Update event
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, description, eventDate, location, category,
      price, capacity, status, image_url, organizer_name,
      has_seating, seating_config, expenses
    } = req.body;
    const userId = req.user.userId;
    const role = req.user.role;

    const [events] = await db.query('SELECT organizer_id FROM events WHERE id = ?', [id]);
    if (events.length === 0) return res.status(404).json({ error: 'Event not found' });
    if (events[0].organizer_id !== userId && role !== 'admin') return res.status(403).json({ error: 'Access denied' });

    await db.query(`
      UPDATE events
      SET title = ?, description = ?, event_date = ?, location = ?, category = ?, 
          price = ?, capacity = ?, status = ?, image_url = ?, organizer_name = ?,
          has_seating = ?, seating_config = ?, expenses = ?, updated_at = NOW()
      WHERE id = ?
    `, [
      title, description, eventDate, location, category, price, capacity, status, image_url || null, organizer_name,
      has_seating || false, JSON.stringify(seating_config) || null, expenses || 0, id
    ]);

    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Server error updating event' });
  }
});

// Delete event
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const [events] = await db.query('SELECT organizer_id FROM events WHERE id = ?', [id]);
    if (events.length === 0) return res.status(404).json({ error: 'Event not found' });
    if (events[0].organizer_id !== userId && req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

    await db.query('DELETE FROM events WHERE id = ?', [id]);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Server error deleting event' });
  }
});

module.exports = router;
