const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function fix() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'admin',
        database: process.env.DB_NAME || 'event_management'
    });

    try {
        console.log('Recalculating costs for pending/confirmed bookings to fix VIP glitch...');

        // 1. Get all bookings that are confirmed but maybe have wrong costs
        const [bookings] = await connection.query(`
            SELECT b.id, b.selected_seats, b.number_of_tickets, e.price, e.seating_config 
            FROM bookings b
            JOIN events e ON b.event_id = e.id
            WHERE b.payment_status = 'pending'
        `);

        for (const b of bookings) {
            if (!b.selected_seats) continue;

            const config = typeof b.seating_config === 'string' ? JSON.parse(b.seating_config) : b.seating_config;
            const selected = typeof b.selected_seats === 'string' ? JSON.parse(b.selected_seats) : b.selected_seats;
            const multiplier = parseFloat(config.vip_price_multiplier || 1.5);
            const basePrice = parseFloat(b.price);

            let newTotal = 0;
            selected.forEach(seatKey => {
                const [r] = seatKey.split('-').map(Number);
                const isVip = config.vip_rows?.includes(r);
                newTotal += isVip ? basePrice * multiplier : basePrice;
            });

            console.log(`Booking #${b.id}: Old Cost recorded. Updating to corrected VIP Cost: ₹${newTotal}`);
            
            await connection.query('UPDATE bookings SET total_cost = ? WHERE id = ?', [newTotal, b.id]);
        }

        console.log('Pricing fix complete!');
    } catch (error) {
        console.error('Error fixing pricing:', error);
    } finally {
        await connection.end();
    }
}

fix();
