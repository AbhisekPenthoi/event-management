const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function fullEliteSetup() {
    console.log('💎 STARTING REPAIR: ABSOLUTE MASTER ELITE SETUP...');
    console.log('Synching your system with all premium "Elite" feature data...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'event_management'
    });

    try {
        console.log('📦 Running Safety Checks & Schema Updates...');

        // Helper to add column if missing (Works on all MySQL versions)
        const ensureColumn = async (table, col, definition) => {
            const [cols] = await connection.query(`SHOW COLUMNS FROM ${table} LIKE ?`, [col]);
            if (cols.length === 0) {
                await connection.query(`ALTER TABLE ${table} ADD COLUMN ${col} ${definition}`);
                console.log(`   + Added missing column ${table}.${col}`);
            }
        };

        // 1. Core Schema Sync
        await ensureColumn('events', 'has_seating', 'BOOLEAN DEFAULT FALSE');
        await ensureColumn('events', 'seating_config', 'JSON DEFAULT NULL');
        await ensureColumn('events', 'organizer_name', 'VARCHAR(100) DEFAULT NULL');

        await ensureColumn('bookings', 'selected_seats', 'JSON DEFAULT NULL');
        await ensureColumn('bookings', 'payment_method', 'VARCHAR(50) DEFAULT "Card"');
        await ensureColumn('bookings', 'qr_token', 'VARCHAR(255) DEFAULT NULL');

        // 2. Coupons Table - Handle specifically (Create or Rename)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS coupons (
                id INT AUTO_INCREMENT PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                discount_value INT NOT NULL,
                discount_type ENUM('percentage', 'flat') DEFAULT 'percentage',
                min_purchase_amount DECIMAL(10, 2) DEFAULT 0.00,
                max_uses INT DEFAULT 100,
                current_uses INT DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                valid_until DATETIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Check for old rename if necessary
        const [oldCol] = await connection.query(`SHOW COLUMNS FROM coupons LIKE 'discount_percent'`);
        const [newCol] = await connection.query(`SHOW COLUMNS FROM coupons LIKE 'discount_value'`);
        if (oldCol.length > 0 && newCol.length === 0) {
            await connection.query(`ALTER TABLE coupons CHANGE COLUMN discount_percent discount_value INT NOT NULL`);
            console.log('   + Renamed legacy column discount_percent to discount_value');
        } else {
            await ensureColumn('coupons', 'discount_value', 'INT NOT NULL');
        }
        await ensureColumn('coupons', 'discount_type', "ENUM('percentage', 'flat') DEFAULT 'percentage'");
        await ensureColumn('coupons', 'min_purchase_amount', 'DECIMAL(10, 2) DEFAULT 0.00');

        // 3. New Elite Tables
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

        // 4. Injecting Professional Data
        console.log('🌟 Injecting Professional Data (Events & Coupons)...');
        
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
            console.log('✅ Added Elite Event with seating map.');
        }

        console.log('\n✅ ALL ELITE FEATURES REPAIRED & READY!');

    } catch (error) {
        console.error('❌ SETUP FAILED:', error.message);
    } finally {
        await connection.end();
    }
}

fullEliteSetup();
