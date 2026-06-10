export default function LifeAreaDetailView({ area, onBack }) {
	if (!area) return null;

	return (
		<section className="life-area-detail-view">
			<header className="life-area-detail-header">
				<button type="button" onClick={onBack} aria-label="Volver al inicio">
					←
				</button>

				<div>
					<span>Área de vida</span>
					<h1>{area.name}</h1>
				</div>
			</header>

			<div className="life-area-hero-card">
				<div
					className="life-area-hero-icon"
					style={{ background: area.color || "#7a58b4" }}
				>
					{area.icon || "✨"}
				</div>

				<div>
					<h2>{area.name}</h2>

					<p>
						{area.description ||
							"Esta área todavía no tiene una descripción detallada."}
					</p>
				</div>
			</div>

			<div className="life-area-detail-grid">
				<article className="life-area-detail-card">
					<span>Progreso</span>
					<strong>0%</strong>
					<p>Más adelante aquí veremos el avance de esta área.</p>
				</article>

				<article className="life-area-detail-card">
					<span>Misiones</span>
					<strong>0</strong>
					<p>Tareas o acciones conectadas a esta área.</p>
				</article>

				<article className="life-area-detail-card">
					<span>Hábitos</span>
					<strong>0</strong>
					<p>Rutinas repetibles para mejorar esta área.</p>
				</article>

				<article className="life-area-detail-card">
					<span>Objetivos</span>
					<strong>0</strong>
					<p>Metas grandes relacionadas con esta área de vida.</p>
				</article>
			</div>
		</section>
	);
}