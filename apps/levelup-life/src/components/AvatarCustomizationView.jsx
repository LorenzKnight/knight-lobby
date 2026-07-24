import { useState } from "react";
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
    const [previewItem, setPreviewItem] = useState(null);

    function getAvatarConfigKey(category) {
        const map = {
            caps: "cap",
            shirts: "shirt",
            legs: "legs",
            feets: "feets",
            // shoes: "feets",
            bags: "bag",
        };

        return map[category];
    }

    function isItemEquipped(item) {
        const configKey = getAvatarConfigKey(avatarCategory);

        if (!configKey) return false;

        return avatarConfig[configKey] === item.item_key;
    }

	function isItemLocked(item) {
		return Boolean(item?.is_locked);
	}

    function isItemUnlocked(item) {
		if (isItemLocked(item)) return false;

		const priceCoins = Number(item.price_coins || 0);

		return priceCoins === 0 || item.is_unlocked;
	}

    function canAffordItem(item) {
        const priceCoins = Number(item.price_coins || 0);
        const playerCoins = Number(player.coins || 0);

        return playerCoins >= priceCoins;
    }

	function getItemPriceClass(item) {
		if (item.is_locked) {
			return "locked-price";
		}

		if (isItemUnlocked(item)) {
			return "unlocked-price";
		}

		if (!canAffordItem(item)) {
			return "not-affordable-price";
		}

		return "";
	}

    function getPreviewPrimaryButtonLabel(item) {
		if (!item) return "Aplicar";

		if (isItemLocked(item)) {
			return "Bloqueado";
		}

		if (isItemEquipped(item)) {
			return "Ya equipado";
		}

		if (isItemUnlocked(item)) {
			return "Aplicar";
		}

		if (!canAffordItem(item)) {
			return "Coins insuficientes";
		}

		return "Comprar y aplicar";
	}

    function isPreviewPrimaryButtonDisabled(item) {
		if (!item) return true;

		if (isItemLocked(item)) {
			return true;
		}

		if (isItemEquipped(item)) {
			return true;
		}

		if (!isItemUnlocked(item) && !canAffordItem(item)) {
			return true;
		}

		return false;
	}

    function handleApplyPreviewItem() {
        if (!previewItem) return;

        const configKey = getAvatarConfigKey(avatarCategory);

        if (!configKey) return;

        handleChangeAvatarPart(configKey, previewItem.item_key);
        setPreviewItem(null);
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
										isItemEquipped(item) ? "active" : ""
									}`}
									onClick={() => setPreviewItem(item)}
								>
									<div className={`avatar-shop-thumb avatar-shop-thumb-${avatarCategory}`}>
										<img
											src={item.thumbnail_url || item.image_url}
											alt={item.name}
										/>

										{(isItemEquipped(item) || isItemUnlocked(item)) && (
											<span className="avatar-shop-status-badge owned">✓</span>
										)}

										{item.is_locked && (
											<span className="avatar-shop-status-badge locked">🔒</span>
										)}
									</div>

									<span>{item.name}</span>

									{item.price_coins > 0 && (
										<small className={getItemPriceClass(item)}>
											🪙 {item.price_coins}
										</small>
									)}
								</button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {previewItem && (
                <div className="avatar-item-preview-backdrop">
                    <div className={`avatar-item-preview-card avatar-item-preview-${avatarCategory}`}>
                        <button
                            type="button"
                            className="avatar-item-preview-close"
                            onClick={() => setPreviewItem(null)}
                            aria-label="Cerrar vista previa"
                        >
                            ×
                        </button>

                        <div
							className={`avatar-item-preview-visual ${
								isItemLocked(previewItem) ? "locked" : ""
							}`}
						>
							<img
								src={previewItem.image_url || previewItem.thumbnail_url}
								alt={previewItem.name}
							/>

							{isItemLocked(previewItem) && (
								<div className="avatar-item-preview-lock">
									<span>🔒</span>
								</div>
							)}
						</div>

                        <span className="avatar-item-preview-category">
                            {avatarCategory === "caps" && "Gorra"}
                            {avatarCategory === "shirts" && "Camisa"}
                            {avatarCategory === "legs" && "Pantalón"}
                            {avatarCategory === "feets" && "Zapatos"}
                            {avatarCategory === "bags" && "Mochila"}
                        </span>

                        <h3>{previewItem.name}</h3>

                        <p>
							{isItemLocked(previewItem)
								? previewItem.description || "Este item todavía no está disponible."
								: previewItem.description ||
									"Prueba este objeto en tu avatar antes de aplicarlo."}
						</p>

                        <div className="avatar-item-preview-details">
                            <div>
                                <span>Precio</span>
                                <strong>
                                    {previewItem.price_coins > 0
                                        ? `🪙 ${previewItem.price_coins}`
                                        : "Gratis"}
                                </strong>
                            </div>

                            <div>
                                <span>Estado</span>
                                <strong>
									{isItemLocked(previewItem)
										? "Bloqueado"
										: isItemEquipped(previewItem)
											? "Equipado"
											: isItemUnlocked(previewItem)
												? "Disponible"
												: canAffordItem(previewItem)
													? "No comprado"
													: "Sin coins"}
								</strong>
                            </div>
                        </div>

                        <div className="avatar-item-preview-actions">
                            <button
                                type="button"
                                className="avatar-item-preview-secondary"
                                onClick={() => setPreviewItem(null)}
                            >
                                {isItemLocked(previewItem) ? "Cerrar" : "Cancelar"}
                            </button>

                            <button
                                type="button"
                                className="avatar-item-preview-primary"
                                onClick={handleApplyPreviewItem}
                                disabled={isPreviewPrimaryButtonDisabled(previewItem)}
                            >
                                {getPreviewPrimaryButtonLabel(previewItem)}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
	);
}