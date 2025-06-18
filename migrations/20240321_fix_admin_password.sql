-- Cập nhật password hash cho admin user
UPDATE users 
SET password_hash = '$2b$10$KjIBeqTnMGo4kCVaxKQ6TeTvkbezLNpvHmrvnwo/c2XyZ5Rw6xZ3O'
WHERE username = 'admin'; 