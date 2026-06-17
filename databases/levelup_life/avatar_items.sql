CREATE TABLE IF NOT EXISTS avatar_items (
    avatar_item_id SERIAL PRIMARY KEY,
    item_key VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    name VARCHAR(120) NOT NULL,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    price_coins INT DEFAULT 0,
    is_default BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    status VARCHAR(30) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO avatar_items
(item_key, category, name, image_url, thumbnail_url, price_coins, is_default, sort_order)
VALUES
('cap_01', 'caps', 'Cap 1', '/avatar/caps/cap_01.png', '/avatar/caps/cap_01.png', 0, true, 1),

('shirt_01', 'shirts', 'Camiseta blanca', '/avatar/shirts/shirt_01.png', '/avatar/shirts/shirt_01.png', 0, true, 1),

('legs_01', 'legs', 'Pantalón Kaqui', '/avatar/legs/legs_01.png', '/avatar/legs/legs_01.png', 0, true, 1),
('legs_02', 'legs', 'Pantalón Jeans', '/avatar/legs/legs_02.png', '/avatar/legs/legs_02.png', 0, false, 2),
('legs_03', 'legs', 'Pantalón Olive', '/avatar/legs/legs_03.png', '/avatar/legs/legs_03.png', 0, false, 3),
('legs_04', 'legs', 'Pantalón Brown', '/avatar/legs/legs_04.png', '/avatar/legs/legs_04.png', 0, false, 4),
('legs_05', 'legs', 'Pantalón Gray', '/avatar/legs/legs_05.png', '/avatar/legs/legs_05.png', 0, false, 5),

('feets_01', 'feets', 'AJ1 Chicago', '/avatar/feets/feets_01.png', '/avatar/feets/feets_01.png', 0, true, 1),
('feets_02', 'feets', 'AJ3 True Blue', '/avatar/feets/feets_02.png', '/avatar/feets/feets_02.png', 150, false, 2)
ON CONFLICT (item_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS user_avatar_items (
	user_id BIGINT NOT NULL,
	category VARCHAR(50) NOT NULL,
	avatar_item_id INT NOT NULL
		REFERENCES avatar_items(avatar_item_id)
		ON DELETE RESTRICT,
	equipped_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (user_id, category)
);