CREATE TABLE IF NOT EXISTS test_connection (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO test_connection (name)
VALUES ('LevelUp Life database ready');