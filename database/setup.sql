-- =====================================================
-- Event Management System - Complete Database Setup
-- =====================================================
-- This is a single SQL file containing all database setup
-- Run this entire file in MySQL Workbench to set up your database
--
-- IMPORTANT: This file will automatically update existing tables if needed
-- Step 1: Create database
CREATE DATABASE IF NOT EXISTS event_management;
USE event_management;

-- =====================================================
-- Step 2: Create Tables
-- =====================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('user', 'organizer', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    event_date DATETIME NOT NULL,
    location VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) DEFAULT 0.00,
    capacity INT DEFAULT 100,
    organizer_id INT NOT NULL,
    status ENUM('active', 'cancelled', 'completed') DEFAULT 'active',
    image_url TEXT DEFAULT NULL COMMENT 'Base64 image or URL',
    organizer_name VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    number_of_tickets INT NOT NULL,
    total_cost DECIMAL(10, 2) NOT NULL,
    payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
    status ENUM('confirmed', 'cancelled', 'completed') DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    event_id INT DEFAULT NULL,
    booking_id INT DEFAULT NULL,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_review (event_id, user_id)
);

-- Waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_waitlist (event_id, user_id)
);

-- =====================================================
-- Step 3: Update existing tables if needed
-- =====================================================

-- Update image_url column to TEXT if it's still VARCHAR (for existing databases)
ALTER TABLE events MODIFY COLUMN image_url TEXT;

-- =====================================================
-- Step 4: Insert Sample Data
-- =====================================================

-- Insert admin user (username: admin, password: admin123)
INSERT INTO users (username, email, password, full_name, role) 
VALUES ('admin', 'admin@events.com', '$2a$10$3vB.kJjEhECxp5u6VeZgoe8mE./0J5nRohvvCOM2KWLTCI.HNBM8K', 'Admin User', 'admin');

-- Insert sample events
INSERT INTO events (title, description, event_date, location, category, price, capacity, organizer_id, organizer_name) VALUES
('Tech Conference 2024', 'Annual technology conference featuring latest innovations', '2024-06-15 10:00:00', 'Convention Center, Mumbai', 'Technology', 1500.00, 500, 1, 'Tech Corp'),
('Music Festival', 'Summer music festival with multiple artists', '2024-07-20 18:00:00', 'Central Park, Delhi', 'Entertainment', 2000.00, 1000, 1, 'Music Events Inc'),
('Workshop on AI', 'Hands-on workshop on artificial intelligence and machine learning', '2024-05-10 14:00:00', 'Tech Hub, Bangalore', 'Education', 500.00, 100, 1, 'AI Learning Center');

-- =====================================================
-- Completion Message
-- =====================================================
SELECT 'Database setup completed successfully!' as Status;
SELECT 'Admin Login: username="admin", password="admin123"' as Credentials;

