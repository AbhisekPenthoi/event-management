const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function fixAdmin() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'event_management'
    });

    try {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        console.log('Updating admin user...');

        // Attempt to update the existing user 'admin'
        const [result] = await connection.query(
            'UPDATE users SET role = "admin", password = ? WHERE username = "admin"',
            [hashedPassword]
        );

        if (result.affectedRows === 0) {
            console.log('Admin user not found, inserting new admin...');
            await connection.query(
                'INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
                ['admin', 'admin@events.com', hashedPassword, 'Administrator', 'admin']
            );
            console.log('Admin user inserted.');
        } else {
            console.log('Admin user updated successfully.');
        }

    } catch (error) {
        console.error('Error fixing admin:', error);
    } finally {
        await connection.end();
    }
}

fixAdmin();
