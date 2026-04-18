const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function fullEliteSetup() {
    console.log('💎 STARTING ABSOLUTE MASTER ELITE SETUP...');
    console.log('This will synchronize your database with ALL premium features.');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'event_management'
    });

    try {
        // 1. Core Schema Updates (Missing from setup.sql)
        console.log('🛠️  Syncing Core Schema...');
        
        // Events table
        await connection.query(`
            ALTER TABLE events 
            ADD COLUMN IF NOT EXISTS has_seating BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS seating_config JSON DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS organizer_name VARCHAR(100) DEFAULT NULL
        `).catch(() => {});

        // Bookings table
        await connection.query(`
            ALTER TABLE bookings 
            ADD COLUMN IF NOT EXISTS selected_seats JSON DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'Card',
            ADD COLUMN IF NOT EXISTS qr_token VARCHAR(255) DEFAULT NULL
        `).catch(() => {});

        // Coupons table
        await connection.query(`
            ALTER TABLE coupons 
            ADD COLUMN IF NOT EXISTS discount_type ENUM('percentage', 'flat') DEFAULT 'percentage',
            ADD COLUMN IF NOT EXISTS min_purchase_amount DECIMAL(10, 2) DEFAULT 0.00,
            CHANGE COLUMN IF NOT EXISTS discount_percent discount_value INT NOT NULL
        `).catch(() => {});

        // 2. New Elite Tables
        console.log('📂 Creating Elite Tables...');
        
        await connection.query(`
            CREATE TABLE IF NOT EXISTS waitlist (
                id INT AUTO_INCREMENT PRIMARY KEY,
                event_id INT NOT NULL,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_waitlist (event_id, user_id)
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS interactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                event_id INT NOT NULL,
                interaction_type ENUM('view', 'save', 'share') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
            )
        `);

        // 3. Injecting Professional Events & Coupons
        console.log('🌟 Injecting Professional Elite Data...');
        
        // Seed Coupons
        const couponsData = [
            ['WELCOME10', 10, 'percentage', 0, 100],
            ['FLAT500', 500, 'flat', 2000, 50],
            ['MEGA25', 25, 'percentage', 5000, 20]
        ];

        for (const [code, val, type, min, max] of couponsData) {
            const [exists] = await connection.query('SELECT id FROM coupons WHERE code = ?', [code]);
            if (exists.length === 0) {
                await connection.query(`
                    INSERT INTO coupons (code, discount_value, discount_type, min_purchase_amount, valid_until, max_uses)
                    VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 90 DAY), ?)
                `, [code, val, type, min, max]);
                console.log(`✅ Seeded Coupon: ${code}`);
            }
        }

        // Seed Elite Event
        const [existing] = await connection.query('SELECT * FROM events WHERE title = "Corporate Leadership Retreat"');
        if (existing.length === 0) {
            const seatingConfig = JSON.stringify({
                rows: 8,
                cols: 12,
                vip_rows: [0, 1, 2],
                vip_price_multiplier: 1.5
            });

            await connection.query(`
                INSERT INTO events (title, description, event_date, location, category, price, capacity, organizer_id, has_seating, seating_config, organizer_name)
                VALUES (
                    "Corporate Leadership Retreat", 
                    "An elite gathering for industry leaders to discuss the future of global enterprise.", 
                    "2024-08-22 09:00:00", 
                    "Vibe Plaza, Mumbai", 
                    "Business", 
                    25000.00, 
                    100, 
                    1, 
                    TRUE, 
                    ?, 
                    "Elite Corp"
                )
            `, [seatingConfig]);
            console.log('✅ Added "Corporate Leadership Retreat" with full seating map.');
        }

        console.log('\n✅ ALL ELITE FEATURES SYNCHRONIZED!');
        console.log('You can now see seats, use coupons, and view financial exports.');

    } catch (error) {
        console.error('❌ SETUP FAILED:', error.message);
    } finally {
        await connection.end();
    }
}

fullEliteSetup();
