-- Create database (you might need to do this manually if not already done)
CREATE DATABASE IF NOT EXISTS bookstore;
USE bookstore;

-- Create Books table
CREATE TABLE IF NOT EXISTS books (
  ISBN VARCHAR(20) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  Author VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  genre VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL
);

-- Create Customers table
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address VARCHAR(255) NOT NULL,
  address2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state CHAR(2) NOT NULL,
  zipcode VARCHAR(10) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_customers_userId ON customers(userId);
