CREATE TABLE IF NOT EXISTS life_areas (
    life_area_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(120) NOT NULL,
    icon VARCHAR(20) DEFAULT '✨',
    description TEXT,
    color VARCHAR(30) DEFAULT '#7a58b4',
    sort_order INT DEFAULT 0,
    status VARCHAR(30) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, slug)
);

INSERT INTO life_areas (
    user_id,
    name,
    slug,
    icon,
    description,
    color,
    sort_order,
    status
)
SELECT
    u.user_id,
    area.name,
    area.slug,
    area.icon,
    area.description,
    area.color,
    area.sort_order,
    'active'
FROM users u
CROSS JOIN (
    VALUES
        ('Vida Espiritual', 'vida-espiritual', '💎', 'Fe, propósito, paz interior y conexión espiritual.', '#7a58b4', 1),
        ('Creatividad', 'creatividad', '🚩', 'Ideas, expresión, diseño, música, escritura y creación.', '#d7a54c', 2),
        ('Carrera Profesional', 'carrera-profesional', '💼', 'Trabajo, aprendizaje, proyectos y crecimiento profesional.', '#5f9a67', 3),
        ('Finanzas', 'finanzas', '🐷', 'Ingresos, ahorro, deudas, inversión y estabilidad económica.', '#e88d57', 4),
        ('Acción Social', 'accion-social', '❤️', 'Ayuda, impacto, comunidad y contribución.', '#d95f6a', 5),
        ('Social', 'social', '👥', 'Familia, pareja, amistades y conexiones personales.', '#5e8fc5', 6)
) AS area(name, slug, icon, description, color, sort_order)
WHERE u.email = 'lorenz@example.com'
ON CONFLICT (user_id, slug) DO NOTHING;