CREATE TABLE IF NOT EXISTS daily_life_penalties (
    daily_life_penalty_id SERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,

    penalty_date DATE NOT NULL,

    missed_tasks INT NOT NULL DEFAULT 0,
    missed_goals INT NOT NULL DEFAULT 0,

    life_lost INT NOT NULL DEFAULT 1,
    level_lost INT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (user_id, penalty_date)
);
