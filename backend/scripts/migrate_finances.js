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
        console.log('Starting Financial Migration...');

        // Add expenses column to events table
        const [columns] = await connection.query('SHOW COLUMNS FROM events');
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('expenses')) {
            await connection.query('ALTER TABLE events ADD COLUMN expenses DECIMAL(10, 2) DEFAULT 0.00');
            console.log('Added expenses column to events table.');
        }

        // Set some sample expenses
        await connection.query('UPDATE events SET expenses = price * capacity * 0.3 WHERE expenses = 0');
        console.log('Updated sample events with estimated expenses.');

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
