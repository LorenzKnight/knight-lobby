CREATE TABLE IF NOT EXISTS shop_categories (
    shop_category_id SERIAL PRIMARY KEY,

    category_key VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    icon_key VARCHAR(50) NOT NULL DEFAULT 'store',

    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shop_items (
    shop_item_id SERIAL PRIMARY KEY,

    shop_category_id INT NOT NULL REFERENCES shop_categories(shop_category_id) ON DELETE CASCADE,

    item_key VARCHAR(80) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    description TEXT,

    price VARCHAR(50) NOT NULL,
    old_price VARCHAR(50),
    currency VARCHAR(30) NOT NULL DEFAULT 'coin',

    discount_label VARCHAR(50),
    image_emoji VARCHAR(20),
    image_url TEXT,

    item_type VARCHAR(50) NOT NULL DEFAULT 'consumable',
    effect_type VARCHAR(80),
    effect_value NUMERIC,

    duration_minutes INT,

    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO shop_categories (
    category_key,
    title,
    description,
    icon_key,
    sort_order
)
VALUES
    (
        'gems',
        'Gems',
        'Premium currency for special items',
        'gem',
        1
    ),
    (
        'life',
        'Life',
        'Recover hearts when you need help',
        'heart',
        2
    ),
    (
        'boosts',
        'Boosts',
        'Temporary bonuses for focused sessions',
        'zap',
        3
    ),
    (
        'protection',
        'Protection',
        'Protect your life and streak',
        'shield',
        4
    )
ON CONFLICT (category_key) DO UPDATE
SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    icon_key = EXCLUDED.icon_key,
    sort_order = EXCLUDED.sort_order,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO shop_items (
    shop_category_id,
    item_key,
    name,
    description,
    price,
    old_price,
    currency,
    discount_label,
    image_emoji,
    image_url,
    item_type,
    effect_type,
    effect_value,
    duration_minutes,
    sort_order,
    is_active
)
VALUES
    (
        (SELECT shop_category_id FROM shop_categories WHERE category_key = 'gems'),
        'small_gem_pack',
        'Small Gem Pack',
        'Get 10 gems.',
        'Real money',
        NULL,
        'real',
        NULL,
        '💎',
        NULL,
        'premium_currency',
        'add_gems',
        10,
        NULL,
        1,
        TRUE
    ),
    (
        (SELECT shop_category_id FROM shop_categories WHERE category_key = 'gems'),
        'medium_gem_pack',
        'Medium Gem Pack',
        'Get 50 gems.',
        'Real money',
        NULL,
        'real',
        'Best value',
        '💎',
        NULL,
        'premium_currency',
        'add_gems',
        50,
        NULL,
        2,
        TRUE
    ),
    (
        (SELECT shop_category_id FROM shop_categories WHERE category_key = 'gems'),
        'big_gem_pack',
        'Big Gem Pack',
        'Get 120 gems.',
        'Real money',
        NULL,
        'real',
        '20% OFF',
        '💎',
        NULL,
        'premium_currency',
        'add_gems',
        120,
        NULL,
        3,
        TRUE
    ),

    (
        (SELECT shop_category_id FROM shop_categories WHERE category_key = 'life'),
        'life_potion',
        'Life Potion',
        'Recover 1 heart.',
        '1',
        NULL,
        'gem',
        NULL,
        '❤️',
        NULL,
        'consumable',
        'recover_life',
        1,
        NULL,
        1,
        TRUE
    ),
    (
        (SELECT shop_category_id FROM shop_categories WHERE category_key = 'life'),
        'full_life_potion',
        'Full Life Potion',
        'Recover all hearts.',
        '3',
        '4',
        'gem',
        '25% OFF',
        '💖',
        NULL,
        'consumable',
        'recover_full_life',
        NULL,
        NULL,
        2,
        TRUE
    ),
    (
        (SELECT shop_category_id FROM shop_categories WHERE category_key = 'life'),
        'emergency_heart',
        'Emergency Heart',
        'Recover 1 heart instantly.',
        '150',
        NULL,
        'coin',
        NULL,
        '🫀',
        NULL,
        'consumable',
        'recover_life',
        1,
        NULL,
        3,
        TRUE
    ),

    (
        (SELECT shop_category_id FROM shop_categories WHERE category_key = 'boosts'),
        'exp_boost_30_min',
        'EXP Boost',
        '+50% EXP for 30 minutes.',
        '2',
        NULL,
        'gem',
        NULL,
        '⚡',
        NULL,
        'boost',
        'exp_multiplier',
        1.5,
        30,
        1,
        TRUE
    ),
    (
        (SELECT shop_category_id FROM shop_categories WHERE category_key = 'boosts'),
        'coins_boost_30_min',
        'Coins Boost',
        'Double coins for 30 minutes.',
        '2',
        NULL,
        'gem',
        NULL,
        '🪙',
        NULL,
        'boost',
        'coins_multiplier',
        2,
        30,
        2,
        TRUE
    ),
    (
        (SELECT shop_category_id FROM shop_categories WHERE category_key = 'boosts'),
        'focus_boost',
        'Focus Boost',
        'Extra reward for focused sessions.',
        '200',
        '250',
        'coin',
        '20% OFF',
        '🔥',
        NULL,
        'boost',
        'focus_bonus',
        1,
        60,
        3,
        TRUE
    ),

    (
        (SELECT shop_category_id FROM shop_categories WHERE category_key = 'protection'),
        'daily_shield',
        'Daily Shield',
        'Avoid losing 1 heart tomorrow.',
        '2',
        NULL,
        'gem',
        NULL,
        '🛡️',
        NULL,
        'protection',
        'daily_life_shield',
        1,
        1440,
        1,
        TRUE
    ),
    (
        (SELECT shop_category_id FROM shop_categories WHERE category_key = 'protection'),
        'second_chance',
        'Second Chance',
        'Save one missed previous day.',
        '3',
        '4',
        'gem',
        '25% OFF',
        '🔁',
        NULL,
        'protection',
        'second_chance',
        1,
        NULL,
        2,
        TRUE
    ),
    (
        (SELECT shop_category_id FROM shop_categories WHERE category_key = 'protection'),
        'anti_drop_charm',
        'Anti-Drop Charm',
        'Avoid losing a level once.',
        '5',
        NULL,
        'gem',
        'Rare',
        '🔮',
        NULL,
        'protection',
        'avoid_level_drop',
        1,
        NULL,
        3,
        TRUE
    )
ON CONFLICT (item_key) DO UPDATE
SET
    shop_category_id = EXCLUDED.shop_category_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    old_price = EXCLUDED.old_price,
    currency = EXCLUDED.currency,
    discount_label = EXCLUDED.discount_label,
    image_emoji = EXCLUDED.image_emoji,
    image_url = EXCLUDED.image_url,
    item_type = EXCLUDED.item_type,
    effect_type = EXCLUDED.effect_type,
    effect_value = EXCLUDED.effect_value,
    duration_minutes = EXCLUDED.duration_minutes,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;