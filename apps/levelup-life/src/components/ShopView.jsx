import { useEffect, useState } from "react";
import {
	Coins,
	Gem,
	HeartPulse,
	ShieldCheck,
	Sparkles,
	Store,
	X,
	Zap,
} from "lucide-react";
import { getShopItems, purchaseShopItem } from "../services/api";

function ShopView({
    player,
    userId,
    onClose,
    onPurchaseSuccess,
    onPurchaseError,
}) {
	const [shopSections, setShopSections] = useState([]);
    const [shopLoading, setShopLoading] = useState(false);
    const [shopError, setShopError] = useState("");
    const [previewItem, setPreviewItem] = useState(null);
    const [purchasingItemKey, setPurchasingItemKey] = useState(null);

    useEffect(() => {
        async function loadShopItems() {
            setShopLoading(true);
            setShopError("");

            try {
                const result = await getShopItems();

                if (result.success) {
                    setShopSections(result.data || []);
                    return;
                }

                setShopSections([]);
            } catch (error) {
                console.error("Could not load shop items:", error);
                setShopError("Could not load shop items.");
                setShopSections([]);
            } finally {
                setShopLoading(false);
            }
        }

        loadShopItems();
    }, []);

    function getSectionIcon(iconKey) {
        if (iconKey === "gem") {
            return <Gem size={24} strokeWidth={1.9} />;
        }

        if (iconKey === "heart") {
            return <HeartPulse size={24} strokeWidth={1.9} />;
        }

        if (iconKey === "zap") {
            return <Zap size={24} strokeWidth={1.9} />;
        }

        if (iconKey === "shield") {
            return <ShieldCheck size={24} strokeWidth={1.9} />;
        }

        return <Store size={24} strokeWidth={1.9} />;
    }

    function getCurrencyIcon(currency) {
        if (currency === "gem") return "💎";
        if (currency === "coin") return "🪙";
        return "";
    }

    function getFriendlyPurchaseErrorMessage(errorMessage) {
        if (errorMessage.includes("Your life is already full")) {
            return {
                title: "Vida completa",
                message: "Ya tienes todos tus corazones. No necesitas comprar esta poción ahora.",
            };
        }

        if (errorMessage.includes("Not enough gems")) {
            return {
                title: "Gemas insuficientes",
                message: "No tienes suficientes gemas para comprar este item.",
            };
        }

        if (errorMessage.includes("Not enough coins")) {
            return {
                title: "Coins insuficientes",
                message: "No tienes suficientes coins para comprar este item.",
            };
        }

        if (errorMessage.includes("Real money purchases are not available yet")) {
            return {
                title: "Próximamente",
                message: "Las compras con dinero real todavía no están disponibles.",
            };
        }

        if (errorMessage.includes("Shop item not found")) {
            return {
                title: "Item no disponible",
                message: "Este item ya no está disponible en la tienda.",
            };
        }

        return {
            title: "Compra no realizada",
            message: "No pudimos completar la compra. Inténtalo otra vez.",
        };
    }

    function closePreview() {
        if (purchasingItemKey) return;

        setPreviewItem(null);
    }

    async function handlePurchaseItem(item) {
        if (!userId) {
            if (onPurchaseError) {
                onPurchaseError(
                    "Sesión no encontrada",
                    "No pudimos identificar tu usuario. Intenta iniciar sesión otra vez."
                );
            }

            return;
        }

        setPurchasingItemKey(item.item_key);

        try {
            const result = await purchaseShopItem(userId, item.item_key);

            if (!result.success) return;

            setPreviewItem(null);

            if (onPurchaseSuccess) {
                onPurchaseSuccess(result.data.game_profile, item);
            }

            if (onClose) {
                onClose();
            }
        } catch (error) {
            const friendlyMessage = getFriendlyPurchaseErrorMessage(error.message);

            if (onPurchaseError) {
                onPurchaseError(
                    friendlyMessage.title,
                    friendlyMessage.message
                );
            }

            console.warn("Shop purchase blocked:", error.message);
        } finally {
            setPurchasingItemKey(null);
        }
    }

	return (
        <div className="shop-custom-overlay">
            <section className="shop-custom-panel">
                <div className="shop-background-top">
                    <button
                        type="button"
                        className="shop-custom-close"
                        onClick={onClose}
                        aria-label="Close shop"
                    >
                        <X size={24} strokeWidth={1.9} />
                    </button>

                    <div className="shop-wallet-floating">
                        <div className="shop-wallet-pill">
                            <Coins size={20} strokeWidth={1.9} />
                            <strong>{player.coins}</strong>
                        </div>

                        <div className="shop-wallet-pill gems">
                            <Gem size={20} strokeWidth={1.9} />
                            <strong>{player.gems}</strong>
                        </div>
                    </div>

                    <div className="shop-hero-content">
                        <div className="shop-hero-icon">
                            <Store size={38} strokeWidth={1.8} />
                        </div>

                        <div>
                            <span>LevelUp Life</span>
                            <h2>Item Shop</h2>
                            <p>Buy gems, boosts, potions and useful rewards.</p>
                        </div>
                    </div>
                </div>

                <div className="shop-content-sheet">
                    <div className="shop-feature-card">
                        <div className="shop-feature-icon">
                            <Sparkles size={26} strokeWidth={1.9} />
                        </div>

                        <div>
                            <strong>Coins are earned. Gems unlock premium tools.</strong>
                            <small>
                                Use the shop to protect your progress and improve your journey.
                            </small>
                        </div>
                    </div>

                    <div className="shop-sections">
                        {shopLoading && (
                            <p className="shop-state-message">
                                Loading shop items...
                            </p>
                        )}

                        {shopError && (
                            <p className="shop-state-message error">
                                {shopError}
                            </p>
                        )}

                        {!shopLoading && !shopError && shopSections.length === 0 && (
                            <p className="shop-state-message">
                                No shop items available.
                            </p>
                        )}

                        {!shopLoading &&
	                        !shopError &&
                            shopSections.map((section) => (
                                <article className="shop-section-card" key={section.key}>
                                    <div className="shop-section-header">
                                        <div className="shop-section-icon">
                                            {getSectionIcon(section.icon_key)}
                                        </div>

                                        <div>
                                            <strong>{section.title}</strong>
                                            <small>{section.description}</small>
                                        </div>
                                    </div>

                                    <div className="shop-items-grid">
                                        {section.items.map((item) => (
                                            <button
                                                type="button"
                                                className="shop-item-card"
                                                key={item.item_key}
                                                onClick={() => setPreviewItem(item)}
                                            >
                                                <div className="shop-item-visual">
                                                    {item.discount_label && (
                                                        <span className="shop-item-discount">
                                                            {item.discount_label}
                                                        </span>
                                                    )}

                                                    <span className="shop-item-image">
                                                        {item.image_emoji}
                                                    </span>
                                                </div>

                                                <strong className="shop-item-name">
                                                    {item.name}
                                                </strong>

                                                <small className="shop-item-description">
                                                    {item.description}
                                                </small>

                                                <span className="shop-item-price">
                                                    <span className="shop-item-currency">
                                                        {getCurrencyIcon(item.currency)}
                                                    </span>

                                                    <strong>{item.price}</strong>

                                                    {item.old_price && (
                                                        <small>{item.old_price}</small>
                                                    )}
                                                </span>

                                                <span className="shop-item-dot" />
                                            </button>
                                        ))}
                                    </div>
                                </article>
                            ))
                        }
                    </div>
                </div>

                {previewItem && (
                    <div className="shop-preview-backdrop" onClick={closePreview}>
                        <div
                            className="shop-preview-card"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <button
                                type="button"
                                className="shop-preview-close"
                                onClick={closePreview}
                                disabled={purchasingItemKey === previewItem.item_key}
                                aria-label="Close product preview"
                            >
                                ×
                            </button>

                            {previewItem.discount_label && (
                                <span className="shop-preview-discount">
                                    {previewItem.discount_label}
                                </span>
                            )}

                            <div className="shop-preview-icon">
                                {previewItem.image_emoji || "🛒"}
                            </div>

                            <span className="shop-preview-category">
                                {previewItem.currency === "gem" ? "Premium item" : "Shop item"}
                            </span>

                            <h3>{previewItem.name}</h3>

                            <p>{previewItem.description}</p>

                            <div className="shop-preview-info">
                                <span>Precio</span>

                                <strong>
                                    {getCurrencyIcon(previewItem.currency)} {previewItem.price}
                                </strong>
                            </div>

                            {previewItem.old_price && (
                                <div className="shop-preview-info muted">
                                    <span>Antes</span>
                                    <strong>{previewItem.old_price}</strong>
                                </div>
                            )}

                            <div className="shop-preview-info">
                                <span>Tu balance</span>

                                <strong>
                                    {previewItem.currency === "gem"
                                        ? `💎 ${player.gems}`
                                        : `🪙 ${player.coins}`}
                                </strong>
                            </div>

                            <div className="shop-preview-actions">
                                <button
                                    type="button"
                                    className="shop-preview-cancel"
                                    onClick={closePreview}
                                    disabled={purchasingItemKey === previewItem.item_key}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    className="shop-preview-buy"
                                    onClick={() => handlePurchaseItem(previewItem)}
                                    disabled={purchasingItemKey === previewItem.item_key}
                                >
                                    {purchasingItemKey === previewItem.item_key
                                        ? "Comprando..."
                                        : "Comprar"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}

export default ShopView;