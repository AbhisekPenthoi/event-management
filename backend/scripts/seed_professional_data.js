const mysql = require('mysql2/promise');

const banners = {
    ai_summit: 'http://localhost:5000/uploads/ai_summit_banner_1772607594110.png',
    marketing: 'http://localhost:5000/uploads/marketing_masterclass_banner_1772607640875.png',
    tech_expo: 'http://localhost:5000/uploads/tech_expo_banner_v2_1772607724586.png',
    music: 'http://localhost:5000/uploads/music_festival_banner_v3_1772607772468.png',
    leadership: 'http://localhost:5000/uploads/leadership_retreat_banner_v2_1772607789943.png'
};

// Realistic Seating Configs
const configs = {
    ai_summit: JSON.stringify({ rows: 15, cols: 20, vip_rows: [0, 1, 2] }), // Large conference hall
    marketing: JSON.stringify({ rows: 5, cols: 10, vip_rows: [0] }), // Intimate classroom
    tech_expo: JSON.stringify({ rows: 10, cols: 15, vip_rows: [0, 1] }), // Exhibition floor zones
    music: JSON.stringify({ rows: 12, cols: 25, vip_rows: [0, 1, 10, 11] }), // "Standing Pit" front rows + "Backstage VIP"
    leadership: JSON.stringify({ rows: 4, cols: 8, vip_rows: [0] }) // Executive boardroom
};

async function seed() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'admin',
        database: 'event_management'
    });

    try {
        console.log('Clearing existing ephemeral data...');
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
        await connection.execute('TRUNCATE reviews');
        await connection.execute('TRUNCATE bookings');
        await connection.execute('TRUNCATE events');
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

        console.log('Inserting professional events with realistic seating...');
        const events = [
            ['Global AI Summit 2024', 'Experience the future of artificial intelligence with world-class speakers and hands-on workshops.', '2024-05-15 09:00:00', 'Sands Expo Convention Center', 'Technology', 500, 2500, banners.ai_summit, 1, 100000, 1, configs.ai_summit],
            ['Tech Innovation Expo', 'The premier trade show for emerging technologies and hardware innovations.', '2024-06-20 10:00:00', 'Pragati Maidan Hall 5', 'Technology', 1000, 1500, banners.tech_expo, 1, 200000, 1, configs.tech_expo],
            ['Digital Marketing Masterclass', 'Master the art of conversion-focused marketing in this intensive 1-day session.', '2024-04-10 09:30:00', 'The Oberoi Corporate Hall', 'Education', 100, 5000, banners.marketing, 1, 50000, 1, configs.marketing],
            ['Summer Music Festival', 'The biggest outdoor music event of the season featuring top-tier artists. Experience the energy!', '2024-07-05 16:00:00', 'Central Park Arena', 'Entertainment', 5000, 800, banners.music, 1, 300000, 1, configs.music],
            ['Corporate Leadership Retreat', 'Elevate your leadership skills in a serene, luxury environment with executive coaches.', '2024-08-22 08:00:00', 'Himalayan Wellness Resort', 'Business', 50, 25000, banners.leadership, 1, 150000, 1, configs.leadership]
        ];

        for (const e of events) {
            await connection.execute(
                'INSERT INTO events (title, description, event_date, location, category, capacity, price, image_url, organizer_id, expenses, has_seating, seating_config) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                e
            );
        }

        // Get event IDs
        const [rows] = await connection.execute('SELECT id, title FROM events');
        const eventIds = rows.reduce((acc, row) => ({ ...acc, [row.title]: row.id }), {});

        console.log('Seeding professional bookings...');
        const bookings = [
            [1, eventIds['Global AI Summit 2024'], 2, 5000, 'confirmed', 'paid'],
            [1, eventIds['Digital Marketing Masterclass'], 1, 5000, 'confirmed', 'paid'],
            [1, eventIds['Tech Innovation Expo'], 5, 7500, 'confirmed', 'paid'],
            [1, eventIds['Summer Music Festival'], 10, 8000, 'confirmed', 'paid']
        ];

        for (const b of bookings) {
            await connection.execute(
                'INSERT INTO bookings (user_id, event_id, number_of_tickets, total_cost, status, payment_status) VALUES (?, ?, ?, ?, ?, ?)',
                b
            );
        }

        console.log('Professional seeding complete with realistic seating! 🚀');
    } catch (err) {
        console.error('Seeding failed:', err);
    } finally {
        await connection.end();
    }
}

seed();
