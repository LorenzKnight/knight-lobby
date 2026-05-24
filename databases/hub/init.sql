CREATE TABLE IF NOT EXISTS ecosystem_apps (
    app_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    status VARCHAR(30) DEFAULT 'active',
    portal_color VARCHAR(30),
    icon VARCHAR(100),
    route_url VARCHAR(255),
    sort_order INT DEFAULT 0,
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);