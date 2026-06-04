import { useEffect, useState } from "react";
import {
	BarChart3,
	Bell,
	BriefcaseBusiness,
	CalendarCheck,
	ChevronRight,
	Clock3,
	Heart,
	Home,
	Lock,
	LogOut,
	Menu,
	PiggyBank,
	Plus,
	Sparkles,
	Swords,
	// UserRound,
	WalletCards,
} from "lucide-react";
import { getMe, loginUser } from "./api/authApi";
import {
	lifeAreas,
	player,
	priorities,
	progressStats,
} from "./data/mockLevelupData";
import "./App.css";

function App() {
	const [authToken, setAuthToken] = useState(localStorage.getItem("knight_token"));
	const [authUser, setAuthUser] = useState(null);
	const [checkingSession, setCheckingSession] = useState(Boolean(authToken));

	const [loginEmail, setLoginEmail] = useState("");
	const [loginPassword, setLoginPassword] = useState("");
	const [loginError, setLoginError] = useState("");
	const [loginLoading, setLoginLoading] = useState(false);

	const isLoggedIn = Boolean(authToken && authUser);

	useEffect(() => {
		async function loadSession() {
			if (!authToken) {
				setCheckingSession(false);
				return;
			}

			try {
				const result = await getMe(authToken);
				setAuthUser(result.data);
			} catch {
				localStorage.removeItem("knight_token");
				setAuthToken(null);
				setAuthUser(null);
			} finally {
				setCheckingSession(false);
			}
		}

		loadSession();
	}, [authToken]);

	async function handleLoginSubmit(event) {
		event.preventDefault();

		setLoginError("");
		setLoginLoading(true);

		try {
			const result = await loginUser(loginEmail, loginPassword);

			localStorage.setItem("knight_token", result.access_token);

			setAuthToken(result.access_token);
			setAuthUser(result.user);
			setLoginEmail("");
			setLoginPassword("");
		} catch (error) {
			setLoginError(error.message);
		} finally {
			setLoginLoading(false);
		}
	}

	function handleLogout() {
		localStorage.removeItem("knight_token");
		setAuthToken(null);
		setAuthUser(null);
	}

	if (checkingSession) {
		return (
			<main className="levelup-loading">
				<div className="levelup-loading-card">
					<Sparkles size={30} strokeWidth={1.8} />
					<p>Cargando tu partida...</p>
				</div>
			</main>
		);
	}

	if (!isLoggedIn) {
		return (
			<main className="login-landing">
				<section className="login-landing-card">
					<div className="login-brand">
						<div className="login-brand-icon">
							<Lock size={34} strokeWidth={1.8} />
						</div>

						<p className="login-kicker">Life as a video game</p>
						<h1>LevelUp Life</h1>
						<p>
							Organiza tu vida como si fuera un videojuego: hábitos, áreas,
							progreso y misiones diarias.
						</p>
					</div>

					<form className="levelup-login-form" onSubmit={handleLoginSubmit}>
						<label>
							Email
							<input
								type="email"
								placeholder="tu@email.com"
								value={loginEmail}
								onChange={(event) => setLoginEmail(event.target.value)}
								required
							/>
						</label>

						<label>
							Contraseña
							<input
								type="password"
								placeholder="••••••••"
								value={loginPassword}
								onChange={(event) => setLoginPassword(event.target.value)}
								required
							/>
						</label>

						{loginError && <p className="login-error">{loginError}</p>}

						<button type="submit" disabled={loginLoading}>
							{loginLoading ? "Entrando..." : "Entrar a mi vida"}
						</button>
					</form>
				</section>
			</main>
		);
	}

	const displayName =
		authUser?.username ||
		authUser?.first_name ||
		player.username;

	return (
		<main className="levelup-shell">
			<header className="levelup-topbar">
				<button type="button" className="icon-button">
					<Menu size={27} strokeWidth={1.8} />
				</button>

				<h1>Videojuego de La Vida</h1>

				<button type="button" className="icon-button notification-button">
					<Bell size={24} strokeWidth={1.8} />
					<span />
				</button>
			</header>

			<section className="player-card">
				<div className="avatar-zone">
					<div className="level-badge">
						<span>NIVEL</span>
						<strong>{player.level}</strong>
					</div>

					<div className="lowpoly-avatar">
						<div className="avatar-head" />
						<div className="avatar-body" />
						<div className="avatar-arm" />
						<div className="avatar-sword" />
						<div className="avatar-ground" />
					</div>
				</div>

				<div className="player-info">
					<h2>{displayName}</h2>

					<div className="life-row">
						<strong>Vida:</strong>
						<div className="heart-row">
							{Array.from({ length: 8 }).map((_, index) => (
								<Heart
									key={index}
									size={21}
									fill="currentColor"
									strokeWidth={1.8}
								/>
							))}
						</div>
					</div>

					<p className="life-value">
						{player.life} / {player.maxLife}
					</p>

					<div className="next-level">
						<span>Nivel siguiente:</span>
						<div className="exp-line">
							<div style={{ width: "0%" }} />
						</div>
						<small>
							{player.nextLevelExp} EXP ({player.exp}%)
						</small>
					</div>

					<div className="wallet-row">
						<span>🪙 {player.coins} Monedas</span>
						<span>💎 {player.gems}</span>
					</div>
				</div>

				<div className="day-progress-card">
					<p>☀ Progreso del día</p>
					<div className="progress-circle">
						<span>{player.dayProgress}</span>
						<small>%</small>
					</div>
					<p className="progress-note">¡Sigue así!</p>
				</div>
			</section>

			<section className="time-progress-card">
				<div className="clock-card">
					<Clock3 size={24} strokeWidth={1.8} />
					<strong>14:55</strong>
					<span>CST</span>
				</div>

				<div className="progress-list">
					{progressStats.map((item) => (
						<div className="progress-item" key={item.key}>
							<div className="progress-label">
								<CalendarCheck size={21} strokeWidth={1.8} />
								<span>
									{item.label}: {item.value}%
								</span>
							</div>

							<div className="progress-bar">
								<div
									style={{
										width: `${item.value}%`,
										background: item.color,
									}}
								/>
							</div>
						</div>
					))}
				</div>
			</section>

			<section className="life-areas-card">
				<div className="section-title-row">
					<h2>Áreas de Vida</h2>
					<button type="button">
						Ver todas <ChevronRight size={18} />
					</button>
				</div>

				<div className="life-areas-grid">
					{lifeAreas.map((area) => (
						<button type="button" className="life-area-item" key={area.key}>
							<span className="life-area-icon">{area.icon}</span>
							<strong>{area.name}</strong>
							<ChevronRight size={24} strokeWidth={1.8} />
						</button>
					))}
				</div>
			</section>

			<section className="dashboard-grid">
				<article className="priorities-card">
					<div className="card-title">
						<span>🏆</span>
						<h2>Prioridades</h2>
					</div>

					<ol>
						{priorities.map((priority) => (
							<li key={priority}>{priority}</li>
						))}
					</ol>

					<button type="button" className="text-link">
						Ver todas <ChevronRight size={17} />
					</button>
				</article>

				<article className="ai-card">
					<div className="card-title spaced">
						<div>
							<span>🤖</span>
							<h2>Asistente IA</h2>
						</div>
						<strong>BETA</strong>
					</div>

					<p>Tu copiloto para tomar mejores decisiones.</p>

					<div className="assistant-actions">
						<button type="button">
							<CalendarCheck size={22} />
							Crear rutina
						</button>
						<button type="button">
							<BarChart3 size={22} />
							Plan financiero
						</button>
						<button type="button">
							<WalletCards size={22} />
							Presupuesto
						</button>
						<button type="button">
							<BriefcaseBusiness size={22} />
							Manejo de deudas
						</button>
					</div>

					<button type="button" className="text-link">
						Chatear con IA <ChevronRight size={17} />
					</button>
				</article>
			</section>

			<section className="quick-actions-row">
				<button type="button" className="battle-card">
					<Swords size={38} strokeWidth={1.8} />
					<span>
						<strong>Modo batalla</strong>
						<small>Enfrenta desafíos y mejora tu vida</small>
					</span>
					<ChevronRight />
				</button>

				<button type="button" className="shop-card">
					<PiggyBank size={38} strokeWidth={1.8} />
					<span>
						<strong>La Tiendita</strong>
						<small>Mejora tu personaje y equipa tu camino</small>
					</span>
					<ChevronRight />
				</button>
			</section>

			<nav className="levelup-bottom-nav">
				<button type="button" className="active">
					<HomeIcon />
					<span>Inicio</span>
				</button>

				<button type="button">
					<BarChart3 size={24} strokeWidth={1.8} />
					<span>Áreas</span>
				</button>

				<button type="button" className="nav-plus">
					<Plus size={33} strokeWidth={1.8} />
				</button>

				<button type="button">
					<BarChart3 size={24} strokeWidth={1.8} />
					<span>Progreso</span>
				</button>

				<button type="button" onClick={handleLogout}>
					<LogOut size={24} strokeWidth={1.8} />
					<span>Salir</span>
				</button>
			</nav>
		</main>
	);
}

function HomeIcon() {
	return <Home size={24} strokeWidth={1.8} />;
}

export default App;