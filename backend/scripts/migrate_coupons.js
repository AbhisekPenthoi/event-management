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
        console.log('Starting migration: coupons table...');

        await connection.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        discount_percent INT NOT NULL,
        valid_until DATETIME NOT NULL,
        max_uses INT DEFAULT 100,
        current_uses INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Insert a sample coupon
        const [existing] = await connection.query('SELECT * FROM coupons WHERE code = "WELCOME10"');
        if (existing.length === 0) {
            await connection.query('INSERT INTO coupons (code, discount_percent, valid_until, max_uses) VALUES ("WELCOME10", 10, DATE_ADD(NOW(), INTERVAL 30 DAY), 100)');
        }

        console.log('Migration successful: coupons table created.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
