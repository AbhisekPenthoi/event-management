const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');

// Get all bookings (user's own bookings)
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [bookings] = await db.query(`
      SELECT b.*, e.title as event_title, e.event_date, e.location, e.price
      FROM bookings b
      LEFT JOIN events e ON b.event_id = e.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `, [userId]);
    
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Server error fetching bookings' });
  }
});

// Get event bookings (MUST be before /:id route!)
router.get('/event/:eventId', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.userId;

    // Verify user is the event organizer
    const [events] = await db.query('SELECT organizer_id FROM events WHERE id = ?', [eventId]);
    
    if (events.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (events[0].organizer_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to view these bookings' });
    }

    // Get all bookings for this event
    const [bookings] = await db.query(`
      SELECT b.*, u.username, u.email, u.full_name
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      WHERE b.event_id = ?
      ORDER BY b.created_at DESC
    `, [eventId]);

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching event bookings:', error);
    res.status(500).json({ error: 'Server error fetching bookings' });
  }
});

// Get booking by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const [bookings] = await db.query(`
      SELECT b.*, e.title as event_title, e.event_date, e.location, e.description, e.category
      FROM bookings b
      LEFT JOIN events e ON b.event_id = e.id
      WHERE b.id = ? AND b.user_id = ?
    `, [id, userId]);
    
    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json(bookings[0]);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Server error fetching booking' });
  }
});

// Create booking
router.post('/', authenticate, async (req, res) => {
  try {
    const { eventId, numberOfTickets } = req.body;
    const userId = req.user.userId;
    const role = req.user.role;

    // Admins cannot book events
    if (role === 'admin') {
      return res.status(403).json({ error: 'Admins cannot book events' });
    }

    // Validate input
    if (!eventId || !numberOfTickets) {
      return res.status(400).json({ error: 'Event ID and number of tickets are required' });
    }

    // Check if event exists and is active
    const [events] = await db.query('SELECT * FROM events WHERE id = ? AND status = "active"', [eventId]);
    
    if (events.length === 0) {
      return res.status(404).json({ error: 'Event not found or not available' });
    }

    const event = events[0];

    // Check if event has capacity (only count confirmed bookings)
    const [bookings] = await db.query(
      'SELECT SUM(number_of_tickets) as total_booked FROM bookings WHERE event_id = ? AND status = "confirmed"',
      [eventId]
    );

    const totalBooked = bookings[0].total_booked || 0;
    if (totalBooked + numberOfTickets > event.capacity) {
      return res.status(400).json({ error: 'Not enough tickets available' });
    }

    // Calculate total cost
    const totalCost = event.price * numberOfTickets;

    // Create booking
    const [result] = await db.query(`
      INSERT INTO bookings (user_id, event_id, number_of_tickets, total_cost, status, created_at)
      VALUES (?, ?, ?, ?, 'confirmed', NOW())
    `, [userId, eventId, numberOfTickets, totalCost]);

    const bookingId = result.insertId;

    // Try to add payment_status if column exists
    try {
      await db.query('UPDATE bookings SET payment_status = ? WHERE id = ?', ['paid', bookingId]);
    } catch (e) {
      // payment_status column doesn't exist, that's okay
    }

    // Try to create notifications if table exists
    try {
      // Create notification for the event organizer
      await db.query(`
        INSERT INTO notifications (user_id, event_id, booking_id, type, message, created_at)
        VALUES (?, ?, ?, 'booking', ?, NOW())
      `, [
        event.organizer_id, 
        eventId, 
        bookingId, 
        `${numberOfTickets} ticket(s) booked for "${event.title}"`
      ]);

      // Create notification for the user who booked
      await db.query(`
        INSERT INTO notifications (user_id, event_id, booking_id, type, message, created_at)
        VALUES (?, ?, ?, 'booking_confirmation', ?, NOW())
      `, [
        userId, 
        eventId, 
        bookingId, 
        `Your booking for "${event.title}" is confirmed!`
      ]);
    } catch (e) {
      // notifications table doesn't exist yet, that's okay
      console.log('Notifications table not available yet');
    }

    res.status(201).json({ 
      message: 'Booking created successfully',
      bookingId: bookingId,
      totalCost: totalCost
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Server error creating booking' });
  }
});

// Cancel booking
router.put('/:id/cancel', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if booking exists and belongs to user
    const [bookings] = await db.query('SELECT * FROM bookings WHERE id = ? AND user_id = ?', [id, userId]);
    
    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookings[0];
    
    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

    // Update booking status
    await db.query('UPDATE bookings SET status = "cancelled", updated_at = NOW() WHERE id = ?', [id]);

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Server error cancelling booking' });
  }
});

// Reject booking (for organizer)
router.put('/:id/reject', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Get booking details and check permission
    const [bookings] = await db.query('SELECT * FROM bookings WHERE id = ?', [id]);
    
    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookings[0];

    // Get event details to verify organizer
    const [events] = await db.query('SELECT organizer_id FROM events WHERE id = ?', [booking.event_id]);
    
    if (events.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (events[0].organizer_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to reject this booking' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking is already rejected/cancelled' });
    }

    // Reject booking (set status to cancelled)
    await db.query('UPDATE bookings SET status = "cancelled", updated_at = NOW() WHERE id = ?', [id]);

    res.json({ message: 'Booking rejected successfully' });
  } catch (error) {
    console.error('Error rejecting booking:', error);
    res.status(500).json({ error: 'Server error rejecting booking' });
  }
});

module.exports = router;

