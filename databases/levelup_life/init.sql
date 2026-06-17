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

CREATE TABLE IF NOT EXISTS user_rewards_log (
    reward_log_id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    source_id BIGINT,
    exp_earned INT NOT NULL DEFAULT 0,
    coins_earned INT NOT NULL DEFAULT 0,
    gems_earned INT NOT NULL DEFAULT 0,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO user_rewards_log (
    user_id,
    source_type,
    source_id,
    exp_earned,
    coins_earned,
    gems_earned,
    reason
)
SELECT
    1,
    'daily_goal',
    1,
    25,
    10,
    0,
    'Completó una meta diaria'
WHERE NOT EXISTS (
    SELECT 1
    FROM user_rewards_log
    WHERE user_id = 1
      AND source_type = 'daily_goal'
      AND source_id = 1
      AND reason = 'Completó una meta diaria'
);