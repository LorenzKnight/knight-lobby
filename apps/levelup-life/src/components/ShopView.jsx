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

    function shouldCloseShopAfterPurchase(item) {
        const closeShopDeliveryTypes = [
            "instant",
            "activation",
        ];

        return closeShopDeliveryTypes.includes(item.delivery_type);
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

            if (shouldCloseShopAfterPurchase(item) && onClose) {
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

    function formatEffectValue(value) {
        if (value === null || value === undefined) return null;

        const numberValue = Number(value);

        if (Number.isInteger(numberValue)) {
            return numberValue;
        }

        return numberValue;
    }

    function getRarityLabel(rarity) {
        if (rarity === "common") return "Común";
        if (rarity === "uncommon") return "Poco común";
        if (rarity === "rare") return "Raro";
        if (rarity === "epic") return "Épico";

        return "Item";
    }

    function getDeliveryLabel(deliveryType) {
        if (deliveryType === "instant") return "Efecto inmediato";
        if (deliveryType === "activation") return "Se activa al comprar";
        if (deliveryType === "inventory") return "Se guarda en inventario";
        if (deliveryType === "external_payment") return "Compra externa";

        return "Entrega desconocida";
    }

    function getPreviewDetails(item) {
        const effectValue = formatEffectValue(item.effect_value);

        const baseDetails = {
            eyebrow: getRarityLabel(item.rarity),
            title: "Item de tienda",
            effectLabel: "Efecto",
            effectText: item.description,
            rows: [
                {
                    label: "Entrega",
                    value: getDeliveryLabel(item.delivery_type),
                },
                {
                    label: "Rareza",
                    value: getRarityLabel(item.rarity),
                },
            ],
            note: "",
            actionLabel: "Comprar",
            tone: "default",
        };

        if (item.preview_type === "currency_pack") {
            return {
                ...baseDetails,
                eyebrow: "Premium",
                title: "Pack de gemas",
                effectLabel: "Recibes",
                effectText: `Obtienes ${effectValue} gemas premium para usar en items especiales.`,
                rows: [
                    {
                        label: "Contenido",
                        value: `💎 ${effectValue} gems`,
                    },
                    {
                        label: "Entrega",
                        value: getDeliveryLabel(item.delivery_type),
                    },
                ],
                note: "Las compras con dinero real todavía no están disponibles.",
                actionLabel: "Próximamente",
                tone: "premium",
            };
        }

        if (item.preview_type === "life_recovery") {
            return {
                ...baseDetails,
                eyebrow: "Recuperación",
                title: "Recuperar vida",
                effectLabel: "Efecto",
                effectText: `Recupera ${effectValue || 1} corazón de vida inmediatamente.`,
                rows: [
                    {
                        label: "Vida recuperada",
                        value: `❤️ +${effectValue || 1}`,
                    },
                    {
                        label: "Entrega",
                        value: getDeliveryLabel(item.delivery_type),
                    },
                ],
                note: "Ideal cuando estás en riesgo y necesitas seguir jugando.",
                actionLabel: "Usar ahora",
                tone: "life",
            };
        }

        if (item.preview_type === "full_life_recovery") {
            return {
                ...baseDetails,
                eyebrow: "Recuperación rara",
                title: "Vida completa",
                effectLabel: "Efecto",
                effectText: "Restaura todos tus corazones de vida inmediatamente.",
                rows: [
                    {
                        label: "Vida recuperada",
                        value: "❤️ Full life",
                    },
                    {
                        label: "Entrega",
                        value: getDeliveryLabel(item.delivery_type),
                    },
                ],
                note: "Úsalo cuando tengas poca vida y quieras volver al máximo.",
                actionLabel: "Restaurar vida",
                tone: "life",
            };
        }

        if (item.preview_type === "timed_boost") {
            const isExpBoost = item.effect_type === "exp_multiplier";
            const isCoinsBoost = item.effect_type === "coins_multiplier";

            let boostText = item.description;

            if (isExpBoost) {
                boostText = `Multiplica tu EXP x${effectValue} durante ${item.duration_minutes} minutos.`;
            }

            if (isCoinsBoost) {
                boostText = `Multiplica tus coins x${effectValue} durante ${item.duration_minutes} minutos.`;
            }

            return {
                ...baseDetails,
                eyebrow: "Boost temporal",
                title: "Boost activable",
                effectLabel: "Boost",
                effectText: boostText,
                rows: [
                    {
                        label: "Multiplicador",
                        value: effectValue ? `x${effectValue}` : "Bonus activo",
                    },
                    {
                        label: "Duración",
                        value: `${item.duration_minutes} min`,
                    },
                    {
                        label: "Entrega",
                        value: getDeliveryLabel(item.delivery_type),
                    },
                ],
                note: "Se activa inmediatamente después de comprarlo.",
                actionLabel: "Activar boost",
                tone: "boost",
            };
        }

        if (item.preview_type === "protection") {
            return {
                ...baseDetails,
                eyebrow: "Protección",
                title: "Protección activa",
                effectLabel: "Protección",
                effectText: item.description,
                rows: [
                    {
                        label: "Tipo",
                        value: getDeliveryLabel(item.delivery_type),
                    },
                    {
                        label: "Duración",
                        value: item.duration_minutes
                            ? `${item.duration_minutes} min`
                            : "Uso único",
                    },
                ],
                note:
                    item.delivery_type === "inventory"
                        ? "Este item se guardará para usarlo cuando lo necesites."
                        : "Se activa al comprarlo para proteger tu progreso.",
                actionLabel:
                    item.delivery_type === "inventory"
                        ? "Guardar item"
                        : "Activar protección",
                tone: "protection",
            };
        }

        return baseDetails;
    }

    const previewDetails = previewItem
        ? getPreviewDetails(previewItem)
        : null;

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

                            <span className={`shop-preview-category ${previewDetails?.tone || "default"}`}>
                                {previewDetails?.eyebrow}
                            </span>

                            <h3>{previewItem.name}</h3>

                            <p>{previewDetails?.effectText || previewItem.description}</p>

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
                                        : previewItem.currency === "coin"
                                            ? `🪙 ${player.coins}`
                                            : "Pago externo"}
                                </strong>
                            </div>

                            {previewDetails?.rows?.map((row) => (
                                <div className="shop-preview-info" key={row.label}>
                                    <span>{row.label}</span>
                                    <strong>{row.value}</strong>
                                </div>
                            ))}

                            {previewDetails?.note && (
                                <div className={`shop-preview-note ${previewDetails.tone}`}>
                                    {previewDetails.note}
                                </div>
                            )}

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
                                    disabled={
                                        purchasingItemKey === previewItem.item_key ||
                                        previewItem.delivery_type === "external_payment"
                                    }
                                >
                                    {purchasingItemKey === previewItem.item_key
                                        ? "Comprando..."
                                        : previewDetails?.actionLabel || "Comprar"}
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