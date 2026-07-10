CREATE TABLE IF NOT EXISTS shop_purchases (
    shop_purchase_id SERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,

    shop_item_id INT NOT NULL REFERENCES shop_items(shop_item_id) ON DELETE RESTRICT,
    item_key VARCHAR(80) NOT NULL,
    item_name VARCHAR(120) NOT NULL,

    price_paid VARCHAR(50) NOT NULL,
    currency VARCHAR(30) NOT NULL,

    effect_type VARCHAR(80),
    effect_value NUMERIC,
    duration_minutes INT,

    purchase_status VARCHAR(30) NOT NULL DEFAULT 'completed',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shop_purchases_user_id
ON shop_purchases(user_id);

CREATE INDEX IF NOT EXISTS idx_shop_purchases_item_key
ON shop_purchases(item_key);

CREATE INDEX IF NOT EXISTS idx_shop_purchases_created_at
ON shop_purchases(created_at);


CREATE TABLE IF NOT EXISTS user_inventory_items (
    user_inventory_item_id SERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,

    shop_item_id INT NOT NULL REFERENCES shop_items(shop_item_id) ON DELETE RESTRICT,
    item_key VARCHAR(80) NOT NULL,
    item_name VARCHAR(120) NOT NULL,

    quantity INT NOT NULL DEFAULT 1,

    item_type VARCHAR(50) NOT NULL DEFAULT 'consumable',
    effect_type VARCHAR(80),
    effect_value NUMERIC,
    duration_minutes INT,

    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (user_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_user_inventory_items_user_id
ON user_inventory_items(user_id);

CREATE INDEX IF NOT EXISTS idx_user_inventory_items_item_key
ON user_inventory_items(item_key);

CREATE INDEX IF NOT EXISTS idx_user_inventory_items_is_used
ON user_inventory_items(is_used);


CREATE TABLE IF NOT EXISTS user_active_boosts (
    user_active_boost_id SERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,

    shop_item_id INT NOT NULL REFERENCES shop_items(shop_item_id) ON DELETE RESTRICT,
    item_key VARCHAR(80) NOT NULL,
    item_name VARCHAR(120) NOT NULL,

    boost_type VARCHAR(80) NOT NULL,
    boost_value NUMERIC NOT NULL,

    starts_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_active_boosts_user_id
ON user_active_boosts(user_id);

CREATE INDEX IF NOT EXISTS idx_user_active_boosts_boost_type
ON user_active_boosts(boost_type);

CREATE INDEX IF NOT EXISTS idx_user_active_boosts_expires_at
ON user_active_boosts(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_active_boosts_is_active
ON user_active_boosts(is_active);


CREATE TABLE IF NOT EXISTS user_active_protections (
    user_active_protection_id SERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,

    shop_item_id INT NOT NULL REFERENCES shop_items(shop_item_id) ON DELETE RESTRICT,
    item_key VARCHAR(80) NOT NULL,
    item_name VARCHAR(120) NOT NULL,

    protection_type VARCHAR(80) NOT NULL,
    protection_value NUMERIC DEFAULT 1,

    starts_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_active_protections_user_id
ON user_active_protections(user_id);

CREATE INDEX IF NOT EXISTS idx_user_active_protections_protection_type
ON user_active_protections(protection_type);

CREATE INDEX IF NOT EXISTS idx_user_active_protections_is_active
ON user_active_protections(is_active);

CREATE INDEX IF NOT EXISTS idx_user_active_protections_is_used
ON user_active_protections(is_used);