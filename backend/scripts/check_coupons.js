const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function checkCoupons() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'event_management'
    });

    try {
        console.log('Checking coupons...');
        const [rows] = await connection.query('SELECT *, NOW() as current_db_time FROM coupons');
        console.log('Coupons in database:');
        console.log(JSON.stringify(rows, null, 2));
    } catch (error) {
        console.error('Error checking coupons:', error);
    } finally {
        await connection.end();
    }
}

checkCoupons();
