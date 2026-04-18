const mysql = require('mysql2/promise');

async function migrate() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'admin',
        database: 'event_management'
    });

    try {
        console.log('Starting Elite migration...');

        // Add qr_token and check_in_status to bookings
        await connection.execute(`
            ALTER TABLE bookings 
            ADD COLUMN qr_token VARCHAR(255) UNIQUE, 
            ADD COLUMN check_in_status ENUM('pending', 'checked_in') DEFAULT 'pending'
        `);

        console.log('Migration complete: bookings table updated.');
    } catch (err) {
        if (err.code === 'ER_DUP_COLUMN_NAME') {
            console.log('Columns already exist, skipping.');
        } else {
            console.error('Migration failed:', err);
        }
    } finally {
        await connection.end();
    }
}

migrate();
