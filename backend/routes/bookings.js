const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');
const crypto = require('crypto');

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

// Get event bookings count (Public-ish)
router.get('/event/:eventId/count', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    const [bookings] = await db.query(
      'SELECT SUM(number_of_tickets) as total_booked FROM bookings WHERE event_id = ? AND status = "confirmed"',
      [eventId]
    );
    res.json({ count: bookings[0].total_booked || 0 });
  } catch (error) {
    console.error('Error fetching booking count:', error);
    res.status(500).json({ error: 'Server error' });
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
      // If not authorized, return only the count instead of whole list
      const [counts] = await db.query(
        'SELECT SUM(number_of_tickets) as total_booked FROM bookings WHERE event_id = ? AND status = "confirmed"',
        [eventId]
      );
      return res.json({ count: counts[0].total_booked || 0, restricted: true });
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
      SELECT b.*, e.title as event_title, e.event_date, e.location, e.description, e.category, e.seating_config, 
             u.username, u.full_name
      FROM bookings b
      LEFT JOIN events e ON b.event_id = e.id
      LEFT JOIN users u ON b.user_id = u.id
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
    const { eventId, numberOfTickets, selectedSeats } = req.body;
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
    let totalCost = 0;
    if (event.has_seating && selectedSeats) {
      // Ensure config is an object
      const config = typeof event.seating_config === 'string' 
        ? JSON.parse(event.seating_config) 
        : event.seating_config;
        
      const multiplier = parseFloat(config.vip_price_multiplier || 1.5);
      const basePrice = parseFloat(event.price);
      
      selectedSeats.forEach(seatKey => {
        const [r] = seatKey.split('-').map(Number);
        const isVip = config.vip_rows?.includes(r);
        const seatPrice = isVip ? basePrice * multiplier : basePrice;
        totalCost += seatPrice;
      });
    } else {
      totalCost = event.price * numberOfTickets;
    }

    // Create booking (initial status: pending)
    const qrToken = crypto.randomBytes(16).toString('hex');
    const [result] = await db.query(`
      INSERT INTO bookings (user_id, event_id, number_of_tickets, total_cost, payment_status, status, selected_seats, created_at, qr_token)
      VALUES (?, ?, ?, ?, 'pending', 'confirmed', ?, NOW(), ?)
    `, [userId, eventId, numberOfTickets, totalCost, JSON.stringify(selectedSeats), qrToken]);

    const bookingId = result.insertId;

    res.status(201).json({
      message: 'Booking initiated',
      bookingId: bookingId,
      totalCost: totalCost
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Server error creating booking' });
  }
});

// Capture/Process payment
router.post('/:id/payment', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, cardNumber } = req.body;
    const userId = req.user.userId;

    // Check if booking exists
    const [bookings] = await db.query('SELECT b.*, e.title as event_title, e.organizer_id FROM bookings b JOIN events e ON b.event_id = e.id WHERE b.id = ? AND b.user_id = ?', [id, userId]);
    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookings[0];

    // Mock payment processing (simulate success)
    // Advanced: Process payment and save method in DB
    await db.query(`
      UPDATE bookings 
      SET payment_status = "paid", 
          payment_method = ?, 
          updated_at = NOW() 
      WHERE id = ?
    `, [paymentMethod || 'Card', id]);

    // Create notifications after payment
    try {
      await db.query(`
        INSERT INTO notifications (user_id, event_id, booking_id, type, message, created_at)
        VALUES (?, ?, ?, 'booking', ?, NOW())
      `, [booking.organizer_id, booking.event_id, id, `${booking.number_of_tickets} ticket(s) booked for "${booking.event_title}" (Paid)`]);

      await db.query(`
        INSERT INTO notifications (user_id, event_id, booking_id, type, message, created_at)
        VALUES (?, ?, ?, 'booking_confirmation', ?, NOW())
      `, [userId, booking.event_id, id, `Payment successful! Your booking for "${booking.event_title}" is confirmed.`]);
    } catch (e) {
      console.log('Notification error:', e.message);
    }

    res.json({ message: 'Payment successful', bookingId: id });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Server error processing payment' });
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

// Check-in booking (for organizer)
router.put('/:id/check-in', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Get booking details
    const [bookings] = await db.query('SELECT b.*, e.organizer_id, e.title as event_title FROM bookings b JOIN events e ON b.event_id = e.id WHERE b.id = ?', [id]);

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookings[0];

    // Verify organizer or admin
    if (booking.organizer_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to check-in for this event' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ error: 'Cannot check-in for a non-confirmed booking' });
    }

    if (booking.check_in_status === 'checked_in') {
      return res.status(400).json({ error: 'Attendee is already checked-in' });
    }

    // Update check-in status
    await db.query('UPDATE bookings SET check_in_status = "checked_in", updated_at = NOW() WHERE id = ?', [id]);

    res.json({ message: 'Check-in successful!', attendee: booking.user_id, event: booking.event_title });
  } catch (error) {
    console.error('Error checking-in booking:', error);
    res.status(500).json({ error: 'Server error checking-in booking' });
  }
});

module.exports = router;

