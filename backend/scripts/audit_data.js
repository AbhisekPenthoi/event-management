const mysql = require('mysql2/promise');

async function audit() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'admin',
        database: 'event_management'
    });

    try {
        console.log('--- EVENT AUDIT ---');
        const [events] = await connection.execute('SELECT id, title, has_seating, seating_config, image_url FROM events');
        events.forEach(e => {
            console.log(`Event: ${e.title}`);
            console.log(`- ID: ${e.id}`);
            console.log(`- Has Seating: ${e.has_seating}`);
            console.log(`- Seating Config: ${e.seating_config ? 'PRESENT' : 'MISSING'}`);
            console.log(`- Image URL: ${e.image_url}`);
            console.log('-------------------');
        });

        console.log('\n--- BOOKING AUDIT ---');
        const [bookings] = await connection.execute('SELECT count(*) as count FROM bookings');
        console.log(`Total Bookings: ${bookings[0].count}`);

        console.log('\n--- USER ROLE AUDIT ---');
        const [admins] = await connection.execute('SELECT email, role FROM users WHERE role = "admin"');
        console.log('Admins found:', admins.map(a => a.email));

    } catch (err) {
        console.error('Audit failed:', err);
    } finally {
        await connection.end();
    }
}

audit();
