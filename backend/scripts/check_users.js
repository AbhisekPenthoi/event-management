const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function checkUsers() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'event_management'
    });

    try {
        console.log('Checking users...');
        const [rows] = await connection.query('SELECT id, username, email, full_name, role FROM users');
        console.log('Users in database:');
        console.log(JSON.stringify(rows, null, 2));
    } catch (error) {
        console.error('Error checking users:', error);
    } finally {
        await connection.end();
    }
}

checkUsers();
