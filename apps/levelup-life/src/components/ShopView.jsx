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

function ShopView({ player, onClose }) {
	const shopSections = [
        {
            key: "gems",
            title: "Gems",
            description: "Premium currency for special items",
            icon: <Gem size={24} strokeWidth={1.9} />,
            items: [
                {
                    name: "Small Gem Pack",
                    description: "Get 10 gems.",
                    price: "Real money",
                    oldPrice: null,
                    currency: "real",
                    discount: null,
                    image: "💎",
                },
                {
                    name: "Medium Gem Pack",
                    description: "Get 50 gems.",
                    price: "Real money",
                    oldPrice: null,
                    currency: "real",
                    discount: "Best value",
                    image: "💎",
                },
                {
                    name: "Big Gem Pack",
                    description: "Get 120 gems.",
                    price: "Real money",
                    oldPrice: null,
                    currency: "real",
                    discount: "20% OFF",
                    image: "💎",
                },
            ],
        },
        {
            key: "life",
            title: "Life",
            description: "Recover hearts when you need help",
            icon: <HeartPulse size={24} strokeWidth={1.9} />,
            items: [
                {
                    name: "Life Potion",
                    description: "Recover 1 heart.",
                    price: 1,
                    oldPrice: null,
                    currency: "gem",
                    discount: null,
                    image: "❤️",
                },
                {
                    name: "Full Life Potion",
                    description: "Recover all hearts.",
                    price: 3,
                    oldPrice: 4,
                    currency: "gem",
                    discount: "25% OFF",
                    image: "💖",
                },
                {
                    name: "Emergency Heart",
                    description: "Recover 1 heart instantly.",
                    price: 150,
                    oldPrice: null,
                    currency: "coin",
                    discount: null,
                    image: "🫀",
                },
            ],
        },
        {
            key: "boosts",
            title: "Boosts",
            description: "Temporary bonuses for focused sessions",
            icon: <Zap size={24} strokeWidth={1.9} />,
            items: [
                {
                    name: "EXP Boost",
                    description: "+50% EXP for 30 minutes.",
                    price: 2,
                    oldPrice: null,
                    currency: "gem",
                    discount: null,
                    image: "⚡",
                },
                {
                    name: "Coins Boost",
                    description: "Double coins for 30 minutes.",
                    price: 2,
                    oldPrice: null,
                    currency: "gem",
                    discount: null,
                    image: "🪙",
                },
                {
                    name: "Focus Boost",
                    description: "Extra reward for focused sessions.",
                    price: 200,
                    oldPrice: 250,
                    currency: "coin",
                    discount: "20% OFF",
                    image: "🔥",
                },
            ],
        },
        {
            key: "protection",
            title: "Protection",
            description: "Protect your life and streak",
            icon: <ShieldCheck size={24} strokeWidth={1.9} />,
            items: [
                {
                    name: "Daily Shield",
                    description: "Avoid losing 1 heart tomorrow.",
                    price: 2,
                    oldPrice: null,
                    currency: "gem",
                    discount: null,
                    image: "🛡️",
                },
                {
                    name: "Second Chance",
                    description: "Save one missed previous day.",
                    price: 3,
                    oldPrice: 4,
                    currency: "gem",
                    discount: "25% OFF",
                    image: "🔁",
                },
                {
                    name: "Anti-Drop Charm",
                    description: "Avoid losing a level once.",
                    price: 5,
                    oldPrice: null,
                    currency: "gem",
                    discount: "Rare",
                    image: "🔮",
                },
            ],
        },
    ];

    function getCurrencyIcon(currency) {
        if (currency === "gem") return "💎";
        if (currency === "coin") return "🪙";
        return "";
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
                        {shopSections.map((section) => (
                            <article className="shop-section-card" key={section.key}>
                                <div className="shop-section-header">
                                    <div className="shop-section-icon">
                                        {section.icon}
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
                                            key={item.name}
                                        >
                                            <div className="shop-item-visual">
                                                {item.discount && (
                                                    <span className="shop-item-discount">
                                                        {item.discount}
                                                    </span>
                                                )}

                                                <span className="shop-item-image">
                                                    {item.image}
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

                                                {item.oldPrice && (
                                                    <small>{item.oldPrice}</small>
                                                )}
                                            </span>

                                            <span className="shop-item-dot" />
                                        </button>
                                    ))}
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}

export default ShopView;