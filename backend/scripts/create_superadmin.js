const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function createSuperAdmin() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'event_management'
    });

    try {
        const hashedPassword = await bcrypt.hash('superadmin123', 10);
        console.log('Creating superadmin user...');

        // Use REPLACE to ensure clean state
        await connection.query(
            'REPLACE INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
            ['superadmin', 'superadmin@events.com', hashedPassword, 'Super Administrator', 'admin']
        );

        console.log('Superadmin created successfully.');

        // Re-verify the count
        const [rows] = await connection.query('SELECT username, role FROM users WHERE username = "superadmin"');
        console.log('Verification:', rows);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

createSuperAdmin();
