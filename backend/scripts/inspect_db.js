const mysql = require('mysql2/promise');

async function inspect() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'admin',
        database: 'event_management'
    });

    try {
        console.log('Inspecting bookings table...');
        const [columns] = await connection.execute('DESCRIBE bookings');
        columns.forEach(col => {
            console.log(`${col.Field}: ${col.Type}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

inspect();
