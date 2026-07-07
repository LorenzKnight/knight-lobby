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

                {reminder.taskTitle && (
                    <strong className="tamagotchi-reminder-task">
                        {reminder.taskTitle}
                    </strong>
                )}

                {reminder.dailyGoalTitle && (
                    <small className="tamagotchi-reminder-goal">
                        {reminder.dailyGoalTitle}
                    </small>
                )}

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