CREATE TABLE IF NOT EXISTS user_avatar_unlocked_items (
    user_avatar_unlocked_item_id SERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,

    avatar_item_id INT NOT NULL,
    item_key VARCHAR(100) NOT NULL,
    item_type VARCHAR(50) NOT NULL,

    unlocked_by VARCHAR(50) NOT NULL DEFAULT 'coins',
    coins_paid INT NOT NULL DEFAULT 0,

    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (user_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_user_avatar_unlocked_items_user_id
ON user_avatar_unlocked_items(user_id);

CREATE INDEX IF NOT EXISTS idx_user_avatar_unlocked_items_item_key
ON user_avatar_unlocked_items(item_key);