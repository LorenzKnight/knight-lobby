export default function Toast({ toast, onClose }) {
	if (!toast) return null;

	return (
		<div className={`toast-notification toast-${toast.type}`}>
			<div className="toast-icon">
				{toast.type === "success" && "✓"}
				{toast.type === "error" && "!"}
				{toast.type === "info" && "i"}
			</div>

			<div className="toast-content">
				<strong>{toast.title}</strong>
				{toast.message && <span>{toast.message}</span>}
			</div>

			<button type="button" onClick={onClose} aria-label="Cerrar notificación">
				×
			</button>
		</div>
	);
}