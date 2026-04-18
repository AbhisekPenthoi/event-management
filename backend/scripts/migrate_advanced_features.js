const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'admin',
        database: process.env.DB_NAME || 'event_management'
    });

    try {
        console.log('Starting advanced features migration...');

        // 1. Update coupons table
        console.log('Updating coupons table...');
        
        // Add discount_type
        try {
            await connection.query(`
                ALTER TABLE coupons 
                ADD COLUMN discount_type ENUM('percentage', 'flat') DEFAULT 'percentage' AFTER discount_percent
            `);
            console.log('Added discount_type column');
        } catch (e) {
            console.log('discount_type column might already exist');
        }

        // Add min_purchase_amount
        try {
            await connection.query(`
                ALTER TABLE coupons 
                ADD COLUMN min_purchase_amount DECIMAL(10, 2) DEFAULT 0.00 AFTER discount_type
            `);
            console.log('Added min_purchase_amount column');
        } catch (e) {
            console.log('min_purchase_amount column might already exist');
        }

        // Rename discount_percent to discount_value
        try {
            await connection.query(`
                ALTER TABLE coupons 
                CHANGE COLUMN discount_percent discount_value INT NOT NULL
            `);
            console.log('Renamed discount_percent to discount_value');
        } catch (e) {
            console.log('discount_value column already exists or rename skipped');
        }

        // 2. Update bookings table
        console.log('Updating bookings table...');
        
        // Add payment_method
        try {
            await connection.query(`
                ALTER TABLE bookings 
                ADD COLUMN payment_method VARCHAR(50) DEFAULT 'Card' AFTER payment_status
            `);
            console.log('Added payment_method column');
        } catch (e) {
            console.log('payment_method column might already exist');
        }

        // 3. Seed some advanced coupons if they don't exist
        const [flatCoupon] = await connection.query('SELECT * FROM coupons WHERE code = "FLAT500"');
        if (flatCoupon.length === 0) {
            await connection.query(`
                INSERT INTO coupons (code, discount_value, discount_type, min_purchase_amount, valid_until, max_uses) 
                VALUES ("FLAT500", 500, "flat", 2000, DATE_ADD(NOW(), INTERVAL 60 DAY), 50)
            `);
            console.log('Added FLAT500 coupon');
        }

        const [megaCoupon] = await connection.query('SELECT * FROM coupons WHERE code = "MEGA25"');
        if (megaCoupon.length === 0) {
            await connection.query(`
                INSERT INTO coupons (code, discount_value, discount_type, min_purchase_amount, valid_until, max_uses) 
                VALUES ("MEGA25", 25, "percentage", 5000, DATE_ADD(NOW(), INTERVAL 90 DAY), 20)
            `);
            console.log('Added MEGA25 coupon');
        }

        console.log('Migration successful!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
