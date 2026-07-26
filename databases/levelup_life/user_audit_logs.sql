CREATE TABLE IF NOT EXISTS user_audit_logs (
    user_audit_log_id SERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,

    event_type VARCHAR(80) NOT NULL,
    source VARCHAR(80) NOT NULL,
    source_id BIGINT,

    event_date DATE,

    level_before INT,
    life_before INT,
    max_life_before INT,

    level_after INT,
    life_after INT,

    exp_before INT,
    exp_after INT,

    coins_before INT,
    coins_after INT,

    gems_before INT,
    gems_after INT,

    metadata JSONB,
    message TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_audit_logs_user_id
ON user_audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_user_audit_logs_event_type
ON user_audit_logs(event_type);

CREATE INDEX IF NOT EXISTS idx_user_audit_logs_source
ON user_audit_logs(source);

CREATE INDEX IF NOT EXISTS idx_user_audit_logs_event_date
ON user_audit_logs(event_date);

CREATE INDEX IF NOT EXISTS idx_user_audit_logs_created_at
ON user_audit_logs(created_at);