const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');

// Get all interactions for an event
router.get('/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        const [interactions] = await db.query(`
      SELECT i.*, u.username, u.full_name as fullName
      FROM event_interactions i
      JOIN users u ON i.user_id = u.id
      WHERE i.event_id = ?
      ORDER BY i.created_at ASC
    `, [eventId]);
        res.json(interactions);
    } catch (error) {
        console.error('Error fetching interactions:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Post a new interaction (chat or question)
router.post('/:eventId', authenticate, async (req, res) => {
    try {
        const { eventId } = req.params;
        const { type, content, parentId } = req.body;
        const userId = req.user.userId;

        if (!content || !type) {
            return res.status(400).json({ error: 'Content and type are required' });
        }

        const [result] = await db.query(`
      INSERT INTO event_interactions (event_id, user_id, type, content, parent_id, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [eventId, userId, type, content, parentId || null]);

        const [newInteraction] = await db.query(`
      SELECT i.*, u.username, u.full_name as fullName
      FROM event_interactions i
      JOIN users u ON i.user_id = u.id
      WHERE i.id = ?
    `, [result.insertId]);

        res.status(201).json(newInteraction[0]);
    } catch (error) {
        console.error('Error posting interaction:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Upvote a question
router.put('/:id/upvote', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE event_interactions SET upvotes = upvotes + 1 WHERE id = ?', [id]);
        res.json({ message: 'Upvoted successfully' });
    } catch (error) {
        console.error('Error upvoting:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
