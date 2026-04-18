const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function checkAndFixAdmin() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'event_management'
    });

    try {
        console.log('Dumping current users:');
        const [users] = await connection.query('SELECT id, username, email, role FROM users');
        users.forEach(u => console.log(`ID: ${u.id}, Username: [${u.username}], Email: [${u.email}], Role: ${u.role}`));

        const adminUser = users.find(u => u.username.trim() === 'admin');
        const hashedPassword = await bcrypt.hash('admin123', 10);

        if (adminUser) {
            console.log('Fixing existing admin user...');
            await connection.query(
                'UPDATE users SET username = "admin", role = "admin", password = ? WHERE id = ?',
                [hashedPassword, adminUser.id]
            );
        } else {
            console.log('Creating new admin user...');
            await connection.query(
                'INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
                ['admin', 'admin@events.com', hashedPassword, 'Administrator', 'admin']
            );
        }
        console.log('Admin fix complete.');
    } finally {
        await connection.end();
    }
}

checkAndFixAdmin();
