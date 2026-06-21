CREATE TABLE IF NOT EXISTS daily_goals (
    daily_goal_id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    life_area_id INT,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    exp_reward INT NOT NULL DEFAULT 10,
    coins_reward INT NOT NULL DEFAULT 2,
    gems_reward INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_goal_tasks (
    daily_goal_task_id SERIAL PRIMARY KEY,
    daily_goal_id INT NOT NULL REFERENCES daily_goals(daily_goal_id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    progress_type VARCHAR(30) NOT NULL DEFAULT 'checkbox',
    target_value NUMERIC NOT NULL DEFAULT 1,
    step_value NUMERIC NOT NULL DEFAULT 1,
    unit VARCHAR(50) NOT NULL DEFAULT 'task',
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_goal_task_logs (
    daily_goal_task_log_id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    daily_goal_id INT NOT NULL,
    daily_goal_task_id INT NOT NULL,
    progress_value NUMERIC NOT NULL DEFAULT 0,
    completed_date DATE NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, daily_goal_task_id, completed_date)
);

CREATE TABLE IF NOT EXISTS daily_goal_completion_logs (
    daily_goal_completion_log_id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    daily_goal_id INT NOT NULL,
    completed_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, daily_goal_id, completed_date)
);

CREATE TABLE IF NOT EXISTS daily_goal_reward_logs (
    daily_goal_reward_log_id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    rewarded_date DATE NOT NULL,
    exp_earned INT NOT NULL DEFAULT 0,
    coins_earned INT NOT NULL DEFAULT 0,
    gems_earned INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, rewarded_date)
);



ALTER TABLE daily_goal_tasks
ADD COLUMN IF NOT EXISTS progress_type VARCHAR(30) NOT NULL DEFAULT 'checkbox',
ADD COLUMN IF NOT EXISTS target_value NUMERIC NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS step_value NUMERIC NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS unit VARCHAR(50) NOT NULL DEFAULT 'task';


ALTER TABLE daily_goal_task_logs
ADD COLUMN IF NOT EXISTS progress_value NUMERIC NOT NULL DEFAULT 0;