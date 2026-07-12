ALTER TABLE daily_goals
ADD COLUMN IF NOT EXISTS progress_type VARCHAR(30) NOT NULL DEFAULT 'checkbox';

ALTER TABLE daily_goals
ADD COLUMN IF NOT EXISTS target_value NUMERIC NOT NULL DEFAULT 1;

ALTER TABLE daily_goals
ADD COLUMN IF NOT EXISTS unit VARCHAR(30);

ALTER TABLE daily_goals
ADD COLUMN IF NOT EXISTS step_value NUMERIC NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS life_area_reward_logs (
    life_area_reward_log_id SERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,
    life_area_id INT NOT NULL,
    rewarded_date DATE NOT NULL,

    exp_earned INT NOT NULL DEFAULT 0,
    coins_earned INT NOT NULL DEFAULT 0,
    gems_earned INT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (user_id, life_area_id, rewarded_date)
);

CREATE INDEX IF NOT EXISTS idx_life_area_reward_logs_user_id
ON life_area_reward_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_life_area_reward_logs_life_area_id
ON life_area_reward_logs(life_area_id);

CREATE INDEX IF NOT EXISTS idx_life_area_reward_logs_rewarded_date
ON life_area_reward_logs(rewarded_date);