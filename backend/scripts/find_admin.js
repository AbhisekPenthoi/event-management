const mysql = require('mysql2/promise');

async function findAdmin() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'admin',
        database: 'event_management'
    });

    try {
        const [rows] = await connection.execute('SELECT id, email FROM users WHERE role = "admin"');
        console.log(JSON.stringify(rows));
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

findAdmin();
