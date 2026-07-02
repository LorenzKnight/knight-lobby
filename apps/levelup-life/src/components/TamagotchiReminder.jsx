function TamagotchiReminder({ reminder, onClose }) {
	if (!reminder) return null;

	return (
		<div className="tamagotchi-reminder-backdrop">
			<section className="tamagotchi-reminder-card">
				<button
					type="button"
					className="tamagotchi-reminder-close"
					onClick={onClose}
					aria-label="Cerrar recordatorio"
				>
					×
				</button>

				<div className="tamagotchi-reminder-icon">
					{reminder.icon || "🔔"}
				</div>

				<h2>{reminder.title}</h2>

				<p>{reminder.message}</p>

				<button
					type="button"
					className="tamagotchi-reminder-action"
					onClick={onClose}
				>
					Entendido
				</button>
			</section>
		</div>
	);
}

export default TamagotchiReminder;