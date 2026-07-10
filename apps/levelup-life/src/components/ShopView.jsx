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

        try {
            const result = await purchaseShopItem(userId, item.item_key);

            if (!result.success) return;

            if (onPurchaseSuccess) {
                onPurchaseSuccess(result.data.game_profile, item);
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
                                                onClick={() => handlePurchaseItem(item)}
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
            </section>
        </div>
    );
}

export default ShopView;