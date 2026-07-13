-- Gems purchased with real money
UPDATE shop_items
SET
    rarity = 'common',
    preview_type = 'currency_pack',
    delivery_type = 'external_payment',
    is_consumable = FALSE,
    discount_percent = NULL
WHERE item_key = 'small_gem_pack';

UPDATE shop_items
SET
    rarity = 'uncommon',
    preview_type = 'currency_pack',
    delivery_type = 'external_payment',
    is_consumable = FALSE,
    discount_percent = NULL
WHERE item_key = 'medium_gem_pack';

UPDATE shop_items
SET
    rarity = 'rare',
    preview_type = 'currency_pack',
    delivery_type = 'external_payment',
    is_consumable = FALSE,
    discount_percent = 20
WHERE item_key = 'big_gem_pack';


-- Life products
UPDATE shop_items
SET
    rarity = 'common',
    preview_type = 'life_recovery',
    delivery_type = 'instant',
    is_consumable = TRUE,
    discount_percent = NULL
WHERE item_key = 'life_potion';

UPDATE shop_items
SET
    rarity = 'rare',
    preview_type = 'full_life_recovery',
    delivery_type = 'instant',
    is_consumable = TRUE,
    discount_percent = 25
WHERE item_key = 'full_life_potion';

UPDATE shop_items
SET
    rarity = 'common',
    preview_type = 'life_recovery',
    delivery_type = 'instant',
    is_consumable = TRUE,
    discount_percent = NULL
WHERE item_key = 'emergency_heart';


-- Boosts
UPDATE shop_items
SET
    rarity = 'uncommon',
    preview_type = 'timed_boost',
    delivery_type = 'activation',
    is_consumable = TRUE,
    discount_percent = NULL
WHERE item_key = 'exp_boost_30_min';

UPDATE shop_items
SET
    rarity = 'uncommon',
    preview_type = 'timed_boost',
    delivery_type = 'activation',
    is_consumable = TRUE,
    discount_percent = NULL
WHERE item_key = 'coins_boost_30_min';

UPDATE shop_items
SET
    rarity = 'rare',
    preview_type = 'timed_boost',
    delivery_type = 'activation',
    is_consumable = TRUE,
    discount_percent = 20
WHERE item_key = 'focus_boost';


-- Protection
UPDATE shop_items
SET
    rarity = 'uncommon',
    preview_type = 'protection',
    delivery_type = 'activation',
    is_consumable = TRUE,
    discount_percent = NULL
WHERE item_key = 'daily_shield';

UPDATE shop_items
SET
    rarity = 'rare',
    preview_type = 'protection',
    delivery_type = 'instant',
    is_consumable = TRUE,
    discount_percent = 25
WHERE item_key = 'second_chance';

UPDATE shop_items
SET
    rarity = 'epic',
    preview_type = 'protection',
    delivery_type = 'inventory',
    is_consumable = TRUE,
    discount_percent = NULL
WHERE item_key = 'anti_drop_charm';