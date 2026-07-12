ALTER TABLE daily_goal_completion_logs
ADD COLUMN IF NOT EXISTS progress_value NUMERIC NOT NULL DEFAULT 0;

ALTER TABLE daily_goal_completion_logs
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN;

UPDATE daily_goal_completion_logs
SET is_completed = TRUE
WHERE is_completed IS NULL;

ALTER TABLE daily_goal_completion_logs
ALTER COLUMN is_completed SET DEFAULT FALSE;

ALTER TABLE daily_goal_completion_logs
ALTER COLUMN is_completed SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_goal_completion_logs_unique_day
ON daily_goal_completion_logs(user_id, daily_goal_id, completed_date);