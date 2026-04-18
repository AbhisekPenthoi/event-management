const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function checkSchemas() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'event_management'
    });

    try {
        const [waitlist] = await connection.query('DESC waitlist');
        console.log('waitlist table:', waitlist);

        const [coupons] = await connection.query('DESC coupons');
        console.log('coupons table:', coupons);
    } catch (error) {
        console.error('Error checking schemas:', error);
    } finally {
        await connection.end();
    }
}

checkSchemas();
