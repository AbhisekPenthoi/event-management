const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'event_management'
    });

    try {
        console.log('Starting Seating Migration (Safe Version)...');

        // Manually check and add columns for events table
        const [eventColumns] = await connection.query('SHOW COLUMNS FROM events');
        const eventColumnNames = eventColumns.map(c => c.Field);

        if (!eventColumnNames.includes('has_seating')) {
            await connection.query('ALTER TABLE events ADD COLUMN has_seating BOOLEAN DEFAULT FALSE');
            console.log('Added has_seating to events.');
        }
        if (!eventColumnNames.includes('seating_config')) {
            await connection.query('ALTER TABLE events ADD COLUMN seating_config JSON DEFAULT NULL');
            console.log('Added seating_config to events.');
        }

        // Manually check and add columns for bookings table
        const [bookingColumns] = await connection.query('SHOW COLUMNS FROM bookings');
        const bookingColumnNames = bookingColumns.map(c => c.Field);

        if (!bookingColumnNames.includes('selected_seats')) {
            await connection.query('ALTER TABLE bookings ADD COLUMN selected_seats JSON DEFAULT NULL');
            console.log('Added selected_seats to bookings.');
        }

        // Update sample event
        const [events] = await connection.query('SELECT id FROM events LIMIT 1');
        if (events.length > 0) {
            const eventId = events[0].id;
            const sampleConfig = {
                rows: 6,
                cols: 10,
                vip_rows: [0, 1],
                vip_price_multiplier: 1.5
            };
            await connection.query(
                'UPDATE events SET has_seating = TRUE, seating_config = ? WHERE id = ?',
                [JSON.stringify(sampleConfig), eventId]
            );
            console.log(`Updated event ID ${eventId} with sample seating config.`);
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
