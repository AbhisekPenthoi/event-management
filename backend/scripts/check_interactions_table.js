const mysql = require('mysql2/promise');

async function check() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'admin',
        database: 'event_management'
    });

    try {
        const [rows] = await connection.execute("SHOW TABLES LIKE 'event_interactions'");
        console.log('Table exists:', rows.length > 0);
        if (rows.length === 0) {
            console.log('Creating event_interactions table...');
            await connection.execute(`
                CREATE TABLE event_interactions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    event_id INT NOT NULL,
                    user_id INT NOT NULL,
                    type ENUM('chat', 'question') NOT NULL,
                    content TEXT NOT NULL,
                    parent_id INT DEFAULT NULL,
                    upvotes INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `);
            console.log('Table created successfully.');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

check();
