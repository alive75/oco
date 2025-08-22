-- Create users table and insert 2 fixed users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert 2 fixed users with hashed passwords (123456)
-- Password hash for '123456' using bcrypt with salt rounds 10
INSERT INTO users (email, name, password_hash) VALUES 
  ('usuario1@oco.app', 'Usuário 1', '$2b$10$K8BQI8rJZ0UZYqzL7Fq4O.Nv8Bg6hJ3YpQqGfK7lHvX9tTwO6mJ8S'),
  ('usuario2@oco.app', 'Usuário 2', '$2b$10$K8BQI8rJZ0UZYqzL7Fq4O.Nv8Bg6hJ3YpQqGfK7lHvX9tTwO6mJ8S')
ON CONFLICT (email) DO NOTHING;