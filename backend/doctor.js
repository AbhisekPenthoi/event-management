const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runDoctor() {
    console.log('============= EVENT SYSTEM DOCTOR =============');
    console.log('Time:', new Date().toLocaleString());
    
    let issueCount = 0;

    // 1. Check .env file
    console.log('\n[1/5] Checking Environment File...');
    if (!fs.existsSync('.env')) {
        console.error('❌ ERROR: .env file NOT FOUND in backend directory!');
        console.log('   Action: Create a .env file based on .env.example');
        issueCount++;
    } else {
        console.log('✅ .env file exists');
    }

    // 2. Check Database Connectivity
    console.log('\n[2/5] Checking Database Connectivity...');
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'event_management'
        });
        console.log('✅ Database connected successfully!');
    } catch (err) {
        console.error('❌ ERROR: Could not connect to MySQL!');
        console.error('   Reason:', err.message);
        console.log('   Action: Check your DB_PASSWORD in .env and ensure MySQL is running.');
        issueCount++;
        return; // Can't proceed without DB
    }

    // 3. Check Tables & Elite Schema
    console.log('\n[3/5] Checking Database Schema (Elite Features)...');
    const tablesToCheck = ['users', 'events', 'bookings', 'coupons', 'notifications', 'reviews', 'waitlist'];
    for (const table of tablesToCheck) {
        try {
            await connection.query(`SELECT 1 FROM ${table} LIMIT 1`);
            console.log(`✅ Table '${table}' exists`);
        } catch (e) {
            console.error(`❌ ERROR: Table '${table}' is MISSING!`);
            issueCount++;
        }
    }

    // Check specific Elite columns
    const columnChecks = [
        { table: 'bookings', col: 'payment_method' },
        { table: 'bookings', col: 'selected_seats' },
        { table: 'coupons', col: 'discount_type' },
        { table: 'events', col: 'has_seating' },
        { table: 'events', col: 'seating_config' }
    ];

    for (const check of columnChecks) {
        try {
            await connection.query(`SELECT ${check.col} FROM ${check.table} LIMIT 1`);
            console.log(`✅ Column '${check.table}.${check.col}' exists`);
        } catch (e) {
            console.error(`❌ ERROR: Column '${check.table}.${check.col}' is MISSING!`);
            console.log(`   Action: You MUST run "node scripts/full_elite_setup.js" to fix this.`);
            issueCount++;
        }
    }

    // 4. Check Folders
    console.log('\n[4/5] Checking Folder Structure...');
    const folders = ['uploads', 'scripts', 'config'];
    for (const f of folders) {
        if (fs.existsSync(f)) {
            console.log(`✅ Folder '${f}' exists`);
        } else {
            console.error(`❌ ERROR: Folder '${f}' NOT FOUND!`);
            issueCount++;
        }
    }

    // 5. Backend Status
    console.log('\n[5/5] Port Check...');
    console.log(`ℹ️  Backend will attempt to run on port ${process.env.PORT || 5000}`);

    console.log('\n================================================');
    if (issueCount === 0) {
        console.log('⭐ SYSTEM HEALTHY: Everything looks perfect!');
    } else {
        console.log(`🚨 FOUND ${issueCount} ISSUES! Please follow the actions above.`);
    }
    console.log('================================================');
    
    await connection.end();
}

runDoctor().catch(console.error);
