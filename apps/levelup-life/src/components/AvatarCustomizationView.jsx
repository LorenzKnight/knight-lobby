import PlayerAvatar from "./PlayerAvatar";

export default function AvatarCustomizationView({
	player,
	avatarConfig,
	avatarItems,
	avatarImages,
	avatarCategory,
	setAvatarCategory,
	handleChangeAvatarPart,
	onClose,
}) {
    function getAvatarConfigKey(category) {
        const map = {
            caps: "cap",
            shirts: "shirt",
            legs: "legs",
            feets: "feets",
            shoes: "feets",
        };

        return map[category];
    }

	return (
        <div className="avatar-custom-overlay">
            <div className="avatar-custom-shell">
                <div className="avatar-custom-top">
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar personalización"
                    >
                        ←
                    </button>

                    <div className="avatar-coins-pill">
                        <span>🪙</span>
                        <strong>{player.coins}</strong>
                    </div>
                </div>

                <div className="avatar-custom-preview">
                    <PlayerAvatar avatarImages={avatarImages} />
                </div>

                <div className="avatar-shop-panel">
                    <div className="avatar-shop-handle" />

                    <div className="avatar-shop-tabs">
                        <button
                            type="button"
                            className={avatarCategory === "caps" ? "active" : ""}
                            onClick={() => setAvatarCategory("caps")}
                        >
                            <span>🧢</span>
                            Caps
                        </button>

                        <button
							type="button"
							className={avatarCategory === "shirts" ? "active" : ""}
							onClick={() => setAvatarCategory("shirts")}
						>
							<span>👕</span>
							Shirts
						</button>

                        <button
                            type="button"
                            className={avatarCategory === "legs" ? "active" : ""}
                            onClick={() => setAvatarCategory("legs")}
                        >
                            <span>👖</span>
                            Pants
                        </button>

                        <button
                            type="button"
                            className={avatarCategory === "feets" ? "active" : ""}
                            onClick={() => setAvatarCategory("feets")}
                        >
                            <span>👟</span>
                            Shoes
                        </button>

                        <button
                            type="button"
                            className={avatarCategory === "bags" ? "active" : ""}
                            onClick={() => setAvatarCategory("bags")}
                        >
                            <span>🎒</span>
                            Bags
                        </button>
                    </div>

                    <div className="avatar-shop-filters">
                        <button type="button" className="active">☰ Filter</button>
                        <button type="button">Hoodies</button>
                        <button type="button">Tops & Shirts</button>
                    </div>

                    <div className="avatar-shop-content">
                        <div className="avatar-shop-grid">
                            {avatarItems[avatarCategory]?.map((item) => (
                                <button
                                    type="button"
                                    key={item.item_key}
                                    className={`avatar-shop-item avatar-shop-item-${avatarCategory} ${
                                        avatarConfig[getAvatarConfigKey(avatarCategory)] === item.item_key
                                            ? "active"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        handleChangeAvatarPart(
                                            getAvatarConfigKey(avatarCategory),
                                            item.item_key
                                        )
                                    }
                                >
                                    <div className={`avatar-shop-thumb avatar-shop-thumb-${avatarCategory}`}>
                                        <img
                                            src={item.thumbnail_url || item.image_url}
                                            alt={item.name}
                                        />
                                    </div>

                                    <span>{item.name}</span>

                                    {item.price_coins > 0 && (
                                        <small>🪙 {item.price_coins}</small>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
	);
}