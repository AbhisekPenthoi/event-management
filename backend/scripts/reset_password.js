const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function reset() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'admin',
        database: 'event_management'
    });

    try {
        const email = 'admin@events.com';
        const newPassword = 'admin';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        console.log(`Resetting password for ${email}...`);
        const [result] = await connection.execute(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, email]
        );
        console.log('Update result:', result);
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

reset();
