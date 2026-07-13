ALTER TABLE shop_items
ADD COLUMN IF NOT EXISTS rarity VARCHAR(30) NOT NULL DEFAULT 'common',
ADD COLUMN IF NOT EXISTS preview_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS delivery_type VARCHAR(30) NOT NULL DEFAULT 'instant',
ADD COLUMN IF NOT EXISTS is_consumable BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS discount_percent INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'shop_items_rarity_check'
    ) THEN
        ALTER TABLE shop_items
        ADD CONSTRAINT shop_items_rarity_check
        CHECK (
            rarity IN (
                'common',
                'uncommon',
                'rare',
                'epic',
                'legendary'
            )
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'shop_items_delivery_type_check'
    ) THEN
        ALTER TABLE shop_items
        ADD CONSTRAINT shop_items_delivery_type_check
        CHECK (
            delivery_type IN (
                'instant',
                'inventory',
                'equipment',
                'activation',
                'external_payment'
            )
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'shop_items_discount_percent_check'
    ) THEN
        ALTER TABLE shop_items
        ADD CONSTRAINT shop_items_discount_percent_check
        CHECK (
            discount_percent IS NULL
            OR (
                discount_percent >= 0
                AND discount_percent <= 100
            )
        );
    END IF;
END
$$;