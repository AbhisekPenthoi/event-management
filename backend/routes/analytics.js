const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');

// Get overall analytics (Admin only)
router.get('/overview', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Total events
    const [eventCount] = await db.query('SELECT COUNT(*) as total FROM events');

    // Total users
    const [userCount] = await db.query('SELECT COUNT(*) as total FROM users');

    // Total bookings
    const [bookingCount] = await db.query('SELECT COUNT(*) as total FROM bookings WHERE status = "confirmed"');

    // Total revenue
    const [revenue] = await db.query('SELECT SUM(total_cost) as total FROM bookings WHERE status = "confirmed"');

    // Total expenses
    const [expenses] = await db.query('SELECT SUM(expenses) as total FROM events');

    // Events by category
    const [eventsByCategory] = await db.query(`
      SELECT category, COUNT(*) as count
      FROM events
      GROUP BY category
      ORDER BY count DESC
    `);

    // Recent bookings (last 7 days)
    const [recentBookings] = await db.query(`
      SELECT COUNT(*) as count, DATE(created_at) as date
      FROM bookings
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND status = "confirmed"
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 7
    `);

    // Raw recent activities (latest 10 bookings)
    const [latestActivities] = await db.query(`
      SELECT b.id, u.full_name as user_name, e.title as event_title, b.created_at, b.status
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN events e ON b.event_id = e.id
      ORDER BY b.created_at DESC
      LIMIT 10
    `);

    // Top events by bookings
    const [topEventsRaw] = await db.query(`
      SELECT e.id, e.title, e.expenses, COUNT(b.id) as bookings_count, SUM(b.total_cost) as revenue
      FROM events e
      LEFT JOIN bookings b ON e.id = b.event_id AND b.status = "confirmed"
      GROUP BY e.id, e.title, e.expenses
      ORDER BY bookings_count DESC
      LIMIT 10
    `);

    // Process topEvents to ensure numeric values
    const topEvents = topEventsRaw.map(event => ({
      ...event,
      revenue: parseFloat(event.revenue) || 0,
      expenses: parseFloat(event.expenses) || 0,
      profit: (parseFloat(event.revenue) || 0) - (parseFloat(event.expenses) || 0),
      bookings_count: parseInt(event.bookings_count) || 0
    }));

    res.json({
      overview: {
        totalEvents: eventCount[0].total || 0,
        totalUsers: userCount[0].total || 0,
        totalBookings: bookingCount[0].total || 0,
        totalRevenue: parseFloat(revenue[0].total) || 0,
        totalExpenses: parseFloat(expenses[0].total) || 0,
        totalProfit: (parseFloat(revenue[0].total) || 0) - (parseFloat(expenses[0].total) || 0)
      },
      eventsByCategory: eventsByCategory,
      recentBookings: recentBookings,
      topEvents: topEvents,
      latestActivities: latestActivities
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Server error fetching analytics' });
  }
});

// Get event-specific analytics
router.get('/event/:eventId', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.userId;

    // Check if user is admin or event organizer
    const [events] = await db.query('SELECT organizer_id, expenses FROM events WHERE id = ?', [eventId]);

    if (events.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (events[0].organizer_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Total bookings for event
    const [bookingStats] = await db.query(`
      SELECT 
        COUNT(*) as total_bookings,
        SUM(total_cost) as total_revenue,
        SUM(number_of_tickets) as total_tickets_sold
      FROM bookings
      WHERE event_id = ? AND status = "confirmed"
    `, [eventId]);

    const stats = bookingStats[0];
    const revenue = parseFloat(stats.total_revenue) || 0;
    const expenses = parseFloat(events[0].expenses) || 0;

    // Bookings over time
    const [bookingTrend] = await db.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM bookings
      WHERE event_id = ? AND status = "confirmed"
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [eventId]);

    res.json({
      stats: {
        ...stats,
        total_revenue: revenue,
        total_expenses: expenses,
        total_profit: revenue - expenses
      },
      bookingTrend: bookingTrend
    });
  } catch (error) {
    console.error('Error fetching event analytics:', error);
    res.status(500).json({ error: 'Server error fetching analytics' });
  }
});

// Export bookings as CSV
router.get('/export/bookings', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const [bookings] = await db.query(`
      SELECT b.id, u.username, u.email, u.full_name, e.title as event_title, e.category, b.number_of_tickets, b.total_cost, b.payment_status, b.status, b.created_at as booking_date
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN events e ON b.event_id = e.id
      ORDER BY b.created_at DESC
    `);

    const headers = ['ID', 'Username', 'Email', 'Full Name', 'Event Title', 'Category', 'Tickets', 'Total Cost', 'Payment Status', 'Booking Status', 'Booking Date'];
    const csv = [headers.join(','), ...bookings.map(b => [b.id, b.username, b.email, b.full_name, `"${b.event_title}"`, b.category, b.number_of_tickets, b.total_cost, b.payment_status, b.status, b.booking_date].join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=bookings.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting bookings:', error);
    res.status(500).json({ error: 'Server error exporting bookings' });
  }
});

// Export users as CSV
router.get('/export/users', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const [users] = await db.query(`SELECT id, username, email, full_name, role, created_at FROM users ORDER BY created_at DESC`);
    const headers = ['ID', 'Username', 'Email', 'Full Name', 'Role', 'Created At'];
    const csv = [headers.join(','), ...users.map(u => [u.id, u.username, u.email, u.full_name, u.role, u.created_at].join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting users:', error);
    res.status(500).json({ error: 'Server error exporting users' });
  }
});

// Export financials as CSV
router.get('/export/financials', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const [financials] = await db.query(`
      SELECT e.id, e.title, e.category, e.expenses as total_expenses,
             COALESCE(SUM(b.total_cost), 0) as total_revenue,
             (COALESCE(SUM(b.total_cost), 0) - e.expenses) as net_profit
      FROM events e
      LEFT JOIN bookings b ON e.id = b.event_id AND b.status = 'confirmed'
      GROUP BY e.id, e.title, e.category, e.expenses
      ORDER BY net_profit DESC
    `);

    const headers = ['Event ID', 'Title', 'Category', 'Total Expenses', 'Total Revenue', 'Net Profit'];
    const csv = [
      headers.join(','),
      ...financials.map(f => [
        f.id,
        `"${f.title}"`,
        f.category,
        f.total_expenses,
        f.total_revenue,
        f.net_profit
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=financials.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting financials:', error);
    res.status(500).json({ error: 'Server error exporting financials' });
  }
});

// Export Attendee List for specific event as CSV
router.get('/export/attendees/:eventId', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.userId;

    // Check if user is admin or event organizer
    const [events] = await db.query('SELECT organizer_id, title FROM events WHERE id = ?', [eventId]);

    if (events.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (events[0].organizer_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [attendees] = await db.query(`
      SELECT u.full_name, u.email, b.number_of_tickets, b.total_cost, b.status, b.created_at as booking_date
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.event_id = ? AND b.status = "confirmed"
      ORDER BY u.full_name ASC
    `, [eventId]);

    const headers = ['Full Name', 'Email', 'Tickets', 'Total Paid', 'Status', 'Booking Date'];
    const csv = [
      headers.join(','),
      ...attendees.map(a => [
        `"${a.full_name}"`,
        a.email,
        a.number_of_tickets,
        a.total_cost,
        a.status,
        a.booking_date
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=Attendees_${events[0].title.replace(/\s+/g, '_')}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting attendees:', error);
    res.status(500).json({ error: 'Server error exporting attendees' });
  }
});

module.exports = router;
