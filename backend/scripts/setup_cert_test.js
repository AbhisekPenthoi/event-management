const mysql = require('mysql2/promise');

async function setup() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'admin',
        database: 'event_management'
    });

    try {
        console.log('Checking for past events...');
        const [pastEvents] = await connection.execute('SELECT id, title FROM events WHERE event_date < NOW()');
        console.log('Past events found:', pastEvents);

        if (pastEvents.length === 0) {
            console.log('No past events found. Creating one...');
            await connection.execute(`
                INSERT INTO events (title, description, event_date, location, category, price, capacity, organizer_id)
                VALUES ('Past Event for Testing', 'This event has already happened.', '2023-01-01 10:00:00', 'Virtual', 'Education', 100, 50, 1)
            `);
            console.log('Past event created.');
            const [newEvent] = await connection.execute('SELECT id FROM events WHERE title = "Past Event for Testing"');
            const eventId = newEvent[0].id;

            console.log('Creating a booking for this event...');
            await connection.execute(`
                INSERT INTO bookings (user_id, event_id, number_of_tickets, total_cost, status, payment_status)
                VALUES (1, ?, 1, 100, 'confirmed', 'paid')
            `, [eventId]);
            console.log('Booking created.');
        } else {
            // Ensure user 1 has a booking for one of these events
            const [userBookings] = await connection.execute('SELECT id FROM bookings WHERE user_id = 1 AND event_id = ?', [pastEvents[0].id]);
            if (userBookings.length === 0) {
                console.log('Creating booking for user 1 for existing past event:', pastEvents[0].title);
                await connection.execute(`
                    INSERT INTO bookings (user_id, event_id, number_of_tickets, total_cost, status, payment_status)
                    VALUES (1, ?, 1, 100, 'confirmed', 'paid')
                `, [pastEvents[0].id]);
                console.log('Booking created.');
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

setup();
