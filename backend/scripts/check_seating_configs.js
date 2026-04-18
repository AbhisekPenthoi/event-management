const mysql = require('mysql2/promise');
async function run() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'admin',
            database: 'event_management'
        });
        const [rows] = await connection.execute('SELECT id, title, price, seating_config FROM events WHERE has_seating = 1');
        console.log('--- SEATING EVENTS ---');
        rows.forEach(r => {
            console.log(`ID: ${r.id}, Title: ${r.title}, Price: ${r.price}`);
            console.log(`Config: ${JSON.stringify(r.seating_config)}`);
            console.log('-------------------');
        });
        await connection.end();
    } catch (err) {
        console.error('Database connection failed:', err);
    }
}
run();
