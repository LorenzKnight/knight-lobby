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
            heads: "head",
            torsos: "torso",
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
                            className={avatarCategory === "heads" ? "active" : ""}
                            onClick={() => setAvatarCategory("heads")}
                        >
                            <span>🙂</span>
                            Head
                        </button>

                        <button
                            type="button"
                            className={avatarCategory === "torsos" ? "active" : ""}
                            onClick={() => setAvatarCategory("torsos")}
                        >
                            <span>👕</span>
                            Tops
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
                            {avatarItems[avatarCategory]?.map((item) => ( /* AQUI */
                                <button
                                    type="button"
                                    key={item.item_key}
                                    className={`avatar-shop-item ${
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
                                    <div className="avatar-shop-thumb">
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

                            {/* {avatarCategory === "heads" && (
                                <>
                                    <button
                                        type="button"
                                        className={`avatar-shop-item ${avatarConfig.head === "head_01" ? "active" : ""}`}
                                        onClick={() => handleChangeAvatarPart("head", "head_01")}
                                    >
                                        <div className="avatar-shop-thumb">🙂</div>
                                        <span>Head 1</span>
                                    </button>

                                    <button
                                        type="button"
                                        className={`avatar-shop-item ${avatarConfig.head === "head_02" ? "active" : ""}`}
                                        onClick={() => handleChangeAvatarPart("head", "head_02")}
                                    >
                                        <div className="avatar-shop-thumb">😎</div>
                                        <span>Head 2</span>
                                    </button>
                                </>
                            )}

                            {avatarCategory === "torsos" && (
                                <>
                                    <button
                                        type="button"
                                        className={`avatar-shop-item ${avatarConfig.torso === "torso_01" ? "active" : ""}`}
                                        onClick={() => handleChangeAvatarPart("torso", "torso_01")}
                                    >
                                        <div className="avatar-shop-thumb">👕</div>
                                        <span>Torso 1</span>
                                        <small>🪙 250</small>
                                    </button>

                                    <button
                                        type="button"
                                        className={`avatar-shop-item ${avatarConfig.torso === "torso_02" ? "active" : ""}`}
                                        onClick={() => handleChangeAvatarPart("torso", "torso_02")}
                                    >
                                        <div className="avatar-shop-thumb">🧥</div>
                                        <span>Torso 2</span>
                                        <small>🪙 400</small>
                                    </button>
                                </>
                            )}

                            {avatarCategory === "legs" && (
                                <>
                                    <button
                                        type="button"
                                        className={`avatar-shop-item ${avatarConfig.legs === "legs_01" ? "active" : ""}`}
                                        onClick={() => handleChangeAvatarPart("legs", "legs_01")}
                                    >
                                        <div className="avatar-shop-thumb">👖</div>
                                        <span>Piernas 1</span>
                                    </button>

                                    <button
                                        type="button"
                                        className={`avatar-shop-item ${avatarConfig.legs === "legs_02" ? "active" : ""}`}
                                        onClick={() => handleChangeAvatarPart("legs", "legs_02")}
                                    >
                                        <div className="avatar-shop-thumb">🩳</div>
                                        <span>Piernas 2</span>
                                    </button>

                                    <button
                                        type="button"
                                        className={`avatar-shop-item ${avatarConfig.legs === "legs_03" ? "active" : ""}`}
                                        onClick={() => handleChangeAvatarPart("legs", "legs_03")}
                                    >
                                        <div className="avatar-shop-thumb">👖</div>
                                        <span>Piernas 3</span>
                                    </button>

                                    <button
                                        type="button"
                                        className={`avatar-shop-item ${avatarConfig.legs === "legs_04" ? "active" : ""}`}
                                        onClick={() => handleChangeAvatarPart("legs", "legs_04")}
                                    >
                                        <div className="avatar-shop-thumb">🩳</div>
                                        <span>Piernas 4</span>
                                    </button>

                                    <button
                                        type="button"
                                        className={`avatar-shop-item ${avatarConfig.legs === "legs_05" ? "active" : ""}`}
                                        onClick={() => handleChangeAvatarPart("legs", "legs_05")}
                                    >
                                        <div className="avatar-shop-thumb">🩳</div>
                                        <span>Piernas 5</span>
                                    </button>
                                </>
                            )}

                            {avatarCategory === "shoes" && (
                                <>
                                    <button 
                                        type="button"
                                        className={`avatar-shop-item ${avatarConfig.feets === "feets_01" ? "active" : ""}`}
                                        onClick={() => handleChangeAvatarPart("feets", "feets_01")}
                                    >
                                        <div className="avatar-shop-thumb">👟</div>
                                        <span>Shoes 1</span>
                                    </button>

                                    <button
                                        type="button"
                                        className={`avatar-shop-item ${avatarConfig.feets === "feets_02" ? "active" : ""}`}
                                        onClick={() => handleChangeAvatarPart("feets", "feets_02")}
                                    >
                                        <div className="avatar-shop-thumb">👟</div>
                                        <span>Shoes 2</span>
                                    </button>
                                
                                    <button type="button" className="avatar-shop-item locked">
                                        <div className="avatar-shop-thumb">👟</div>
                                        <span>Shoes</span>
                                        <small>Próximamente</small>
                                    </button>
                                </>
                            )}

                            {avatarCategory === "bags" && (
                                <>
                                    <button type="button" className="avatar-shop-item locked">
                                        <div className="avatar-shop-thumb">🎒</div>
                                        <span>Bag</span>
                                        <small>Próximamente</small>
                                    </button>
                                </>
                            )} */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
	);
}