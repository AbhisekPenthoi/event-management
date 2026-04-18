const mysql = require('mysql2/promise');

async function promote() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'admin',
        database: 'event_management'
    });

    try {
        console.log('Promoting admin@events.com to admin...');
        const [result] = await connection.execute('UPDATE users SET role = "admin" WHERE email = "admin@events.com"');
        console.log('Update result:', result);
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

promote();
