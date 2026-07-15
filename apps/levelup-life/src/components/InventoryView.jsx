import { useCallback, useEffect, useState } from "react";
import {
	Backpack,
	Box,
	Sparkles,
	X,
} from "lucide-react";
import {
	getInventoryItems,
	activateInventoryItem,
} from "../services/api";

function InventoryView({
	player,
	userId,
	onClose,
	onInventoryItemUsed,
	onToast,
}) {
    const [inventorySections, setInventorySections] = useState([]);
    const [inventoryLoading, setInventoryLoading] = useState(false);
    const [inventoryError, setInventoryError] = useState("");
    const [usingItemId, setUsingItemId] = useState(null);
    const [previewItem, setPreviewItem] = useState(null);

    const loadInventoryItems = useCallback(async () => {
        if (!userId) return;

        setInventoryLoading(true);
        setInventoryError("");

        try {
            const result = await getInventoryItems(userId);

            if (result.success) {
                setInventorySections(result.data || []);
                return;
            }

            setInventorySections([]);
        } catch (error) {
            console.error("Could not load inventory items:", error);
            setInventoryError("No pudimos cargar tu mochila.");
            setInventorySections([]);
        } finally {
            setInventoryLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        async function loadData() {
            await loadInventoryItems();
        }

        loadData();
    }, [loadInventoryItems]);

    async function handleUseInventoryItem(item) {
        if (!userId || usingItemId) return;

        if (!item.can_use) {
            onToast?.(
                "No disponible",
                "Este objeto todavía no se puede usar.",
                "error"
            );
            return;
        }

        setUsingItemId(item.inventory_item_id);

        try {
            const result = await activateInventoryItem({
                user_id: userId,
                inventory_item_id: item.inventory_item_id,
            });

            if (result.success) {
                onToast?.(
                    "Objeto usado",
                    `${item.name} fue activado correctamente.`,
                    "success"
                );

                setPreviewItem(null);

                await loadInventoryItems();

                onInventoryItemUsed?.(result.data);

                return;
            }

            onToast?.(
                "No se pudo usar",
                "El objeto no pudo activarse.",
                "error"
            );
        } catch (error) {
            console.error("Could not use inventory item:", error);

            onToast?.(
                "No se pudo usar",
                error.message || "El objeto no pudo activarse.",
                "error"
            );
        } finally {
            setUsingItemId(null);
        }
    }

	return (
		<div className="inventory-overlay">
			<section className="inventory-panel">
				<div className="inventory-background-top">
					<button
						type="button"
						className="inventory-close"
						onClick={onClose}
						aria-label="Cerrar inventario"
					>
						<X size={24} strokeWidth={1.9} />
					</button>

					<div className="inventory-wallet-floating">
						<div className="inventory-wallet-pill">
                            <span>🪙</span>
                            <strong>{player?.coins || 0}</strong>
                        </div>

                        <div className="inventory-wallet-pill gems">
                            <span>💎</span>
                            <strong>{player?.gems || 0}</strong>
                        </div>
					</div>

					<div className="inventory-hero-content">
						<div className="inventory-hero-icon">
							<Backpack size={38} strokeWidth={1.8} />
						</div>

						<div>
							<span>LevelUp Life</span>
							<h2>Inventory</h2>
							<p>Revisa tus objetos, boosts, protecciones y recompensas.</p>
						</div>
					</div>
				</div>

				<div className="inventory-content-sheet">
					<div className="inventory-feature-card">
						<div className="inventory-feature-icon">
							<Sparkles size={26} strokeWidth={1.9} />
						</div>

						<div>
							<strong>Tus objetos guardados viven aquí.</strong>
							<small>
								Usa consumibles, revisa protecciones y equipa recompensas.
							</small>
						</div>
					</div>

					<div className="inventory-sections">
                        {inventoryLoading && (
                            <p className="inventory-state-message">
                                Cargando mochila...
                            </p>
                        )}

                        {inventoryError && (
                            <p className="inventory-state-message error">
                                {inventoryError}
                            </p>
                        )}

                        {!inventoryLoading && !inventoryError && inventorySections.length === 0 && (
                            <div className="inventory-empty-state global">
                                <Box size={32} strokeWidth={1.8} />
                                <strong>Tu mochila está vacía</strong>
                                <small>
                                    Los objetos comprados o desbloqueados aparecerán aquí.
                                </small>
                            </div>
                        )}

                        {!inventoryLoading &&
                            !inventoryError &&
                            inventorySections.map((section) => (
                                <article className="inventory-section-card" key={section.key}>
                                    <div className="inventory-section-header">
                                        <div className="inventory-section-icon">
                                            <span>{section.icon}</span>
                                        </div>

                                        <div>
                                            <strong>{section.title}</strong>
                                            <small>{section.description}</small>
                                        </div>
                                    </div>

                                    <div className="inventory-items-grid">
                                        {section.items.map((item) => (
                                            <button
                                                type="button"
                                                className={`inventory-item-card ${item.item_type}`}
                                                key={item.inventory_item_id}
                                                onClick={() => setPreviewItem(item)}
                                                disabled={usingItemId === item.inventory_item_id}
                                            >
                                                <div className="inventory-item-visual">
                                                    <span className="inventory-item-image">
                                                        {item.image_emoji}
                                                    </span>

                                                    {item.quantity > 1 && (
                                                        <span className="inventory-item-quantity">
                                                            x{item.quantity}
                                                        </span>
                                                    )}
                                                </div>

                                                <strong className="inventory-item-name">
                                                    {item.name}
                                                </strong>

                                                <small className="inventory-item-description">
                                                    {item.description}
                                                </small>

                                                <span className="inventory-item-action">
                                                    {usingItemId === item.inventory_item_id
                                                        ? "Usando..."
                                                        : item.action_label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </article>
                            ))
                        }
                    </div>
				</div>

                {previewItem && (
                    <div className="inventory-preview-backdrop">
                        <div className={`inventory-preview-card ${previewItem.item_type}`}>
                            <button
                                type="button"
                                className="inventory-preview-close"
                                onClick={() => setPreviewItem(null)}
                                aria-label="Cerrar vista previa"
                                disabled={usingItemId === previewItem.inventory_item_id}
                            >
                                <X size={22} strokeWidth={1.9} />
                            </button>

                            <div className="inventory-preview-visual">
                                <span className="inventory-preview-emoji">
                                    {previewItem.image_emoji}
                                </span>

                                {previewItem.quantity > 1 && (
                                    <span className="inventory-preview-quantity">
                                        x{previewItem.quantity}
                                    </span>
                                )}
                            </div>

                            <span className="inventory-preview-type">
                                {previewItem.item_type === "protection"
                                    ? "Protección"
                                    : previewItem.item_type === "boost"
                                        ? "Boost"
                                        : previewItem.item_type === "consumable"
                                            ? "Consumible"
                                            : "Item"}
                            </span>

                            <h3>{previewItem.name}</h3>

                            <p>{previewItem.description}</p>

                            <div className="inventory-preview-details">
                                <div>
                                    <span>Cantidad</span>
                                    <strong>{previewItem.quantity}</strong>
                                </div>

                                <div>
                                    <span>Efecto</span>
                                    <strong>{previewItem.effect_type || "Especial"}</strong>
                                </div>

                                {previewItem.duration_minutes && (
                                    <div>
                                        <span>Duración</span>
                                        <strong>{previewItem.duration_minutes} min</strong>
                                    </div>
                                )}
                            </div>

                            <div className="inventory-preview-actions">
                                <button
                                    type="button"
                                    className="inventory-preview-secondary"
                                    onClick={() => setPreviewItem(null)}
                                    disabled={usingItemId === previewItem.inventory_item_id}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    className="inventory-preview-primary"
                                    onClick={() => handleUseInventoryItem(previewItem)}
                                    disabled={
                                        usingItemId === previewItem.inventory_item_id ||
                                        !previewItem.can_use
                                    }
                                >
                                    {usingItemId === previewItem.inventory_item_id
                                        ? "Usando..."
                                        : previewItem.action_label}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
			</section>
		</div>
	);
}

export default InventoryView;