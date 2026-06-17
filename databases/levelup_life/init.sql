CREATE TABLE IF NOT EXISTS user_game_profiles (
    user_id BIGINT PRIMARY KEY,
    level INT NOT NULL DEFAULT 1,
    current_exp INT NOT NULL DEFAULT 0,
    total_exp INT NOT NULL DEFAULT 0,
    coins INT NOT NULL DEFAULT 0,
    gems INT NOT NULL DEFAULT 0,
    current_life INT NOT NULL DEFAULT 5,
    max_life INT NOT NULL DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO user_game_profiles (
    user_id,
    level,
    current_exp,
    total_exp,
    coins,
    gems,
    current_life,
    max_life
)
VALUES (
    1,
    1,
    120,
    120,
    35,
    2,
    5,
    5
)
ON CONFLICT (user_id) DO NOTHING;