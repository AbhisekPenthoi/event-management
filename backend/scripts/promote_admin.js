const mysql = require('mysql2/promise');

async function run() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'admin',
        database: 'event_management'
    });

    try {
        console.log('Listing all users:');
        const [users] = await connection.execute('SELECT email, role FROM users');
        console.table(users);

        const adminUser = users.find(u => u.email.includes('admin'));
        if (adminUser) {
            console.log(`Promoting ${adminUser.email} to admin...`);
            await connection.execute('UPDATE users SET role = "admin" WHERE email = ?', [adminUser.email]);
            console.log('User promoted successfully.');
        } else {
            console.log('No admin user found to promote.');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

run();
