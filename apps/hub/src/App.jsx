import { useEffect, useMemo, useState } from "react";
import {
	Home,
	Gem,
	LockKeyhole,
	Plus,
	FlaskConical,
	UserRound,
} from "lucide-react";
import { getEcosystemApps } from "./services/api";
import { getMe, getMyApps, loginUser } from "./api/authApi";
import "./App.css";

function App() {
	const [apps, setApps] = useState([]);
	const [loading, setLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState("");

	const [authUser, setAuthUser] = useState(null);
	const [authToken, setAuthToken] = useState(localStorage.getItem("knight_token"));
	const [myApps, setMyApps] = useState([]);

	const [showLoginModal, setShowLoginModal] = useState(false);
	const [loginEmail, setLoginEmail] = useState("");
	const [loginPassword, setLoginPassword] = useState("");
	const [loginError, setLoginError] = useState("");
	const [loginLoading, setLoginLoading] = useState(false);

	const isLoggedIn = Boolean(authUser && authToken);

	useEffect(() => {
		async function loadApps() {
			try {
				const result = await getEcosystemApps();

				if (result.success) {
					setApps(result.data);
				}
			} catch (error) {
				setErrorMessage(error.message);
			} finally {
				setLoading(false);
			}
		}

		loadApps();
	}, []);

	useEffect(() => {
		async function loadSession() {
			if (!authToken) return;

			try {
				const meResult = await getMe(authToken);
				const appsResult = await getMyApps(authToken);

				setAuthUser(meResult.data);
				setMyApps(appsResult.data || []);
			} catch (error) {
				localStorage.removeItem("knight_token");
				setAuthToken(null);
				setAuthUser(null);
				setMyApps([]);
			}
		}

		loadSession();
	}, [authToken]);

	function userHasAccessToApp(slug) {
		return myApps.some(
			(app) => app.slug === slug && app.access_status === "active"
		);
	}

	function canOpenApp(app) {
		if (app.is_locked || app.status === "coming_soon") {
			return false;
		}

		if (!isLoggedIn) {
			return false;
		}

		return userHasAccessToApp(app.slug);
	}

	function handleOpenApp(app) {
		if (app.is_locked || app.status === "coming_soon") {
			return;
		}

		if (!isLoggedIn) {
			setShowLoginModal(true);
			return;
		}

		if (!userHasAccessToApp(app.slug)) {
			return;
		}

		if (!app.route_url || app.route_url === "#") {
			return;
		}

		window.location.assign(app.route_url);
	}

	function getStatusLabel(status) {
		const labels = {
			active: "Activo",
			beta: "Beta",
			coming_soon: "Próximamente",
			locked: "Bloqueado",
		};

		return labels[status] || status;
	}

	function getButtonLabel(app) {
		if (app.is_locked || app.status === "coming_soon") {
			return "Bloqueado";
		}

		if (!isLoggedIn) {
			return "Iniciar sesión";
		}

		if (!userHasAccessToApp(app.slug)) {
			return "Sin acceso";
		}

		return "Entrar";
	}

	function getPortalIcon(app) {
		if (
			app.is_locked ||
			app.status === "coming_soon" ||
			(isLoggedIn && !userHasAccessToApp(app.slug)) ||
			!isLoggedIn
		) {
			return "lock";
		}

		if (app.icon === "coin") {
			return "coin";
		}

		if (app.icon === "spark") {
			return "spark";
		}

		return "crystal";
	}

	function handleCenterAction() {
		if (!isLoggedIn) {
			setShowLoginModal(true);
			return;
		}

		console.log("Abrir formulario para agregar nuevo proyecto");
	}

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
			setShowLoginModal(false);
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
		setMyApps([]);
	}

	const ecosystemProgress = useMemo(() => {
		if (!apps.length) return 0;

		let points = 0;

		apps.forEach((app) => {
			if (app.status === "active") points += 1;
			else if (app.status === "beta") points += 0.75;
			else if (app.status === "coming_soon") points += 0.35;
			else points += 0.2;
		});

		return Math.round((points / apps.length) * 100);
	}, [apps]);

	return (
		<main className="hub-shell">
			<header className="hub-header">
				<div className="brand-gem">
					<div className="brand-gem-top" />
					<div className="brand-gem-mid" />
					<div className="brand-gem-bottom" />
				</div>

				<div>
					<h1>Knight Lobby</h1>
					<p>
						{isLoggedIn
							? `Bienvenido, ${authUser?.first_name || authUser?.username || "Knight"}`
							: "Elige una App"}
					</p>
				</div>

				{isLoggedIn && (
					<button type="button" className="logout-button" onClick={handleLogout}>
						Salir
					</button>
				)}
			</header>

			<section className="worlds-heading">
				<span className="decor decor-left">✣</span>
				<span className="heading-line" />
				<span className="decor-dot">◆</span>
				<h2>Apps disponibles</h2>
				<span className="decor-dot">◆</span>
				<span className="heading-line" />
				<span className="decor decor-right">✣</span>
			</section>

			<section className="app-bottom-nav">
				<button type="button" className="bottom-item">
					<span className="bottom-icon">
						<Home size={22} strokeWidth={1.8} />
					</span>
					<span>Inicio</span>
				</button>

				<button type="button" className="bottom-item active">
					<span className="bottom-icon">
						<Gem size={22} strokeWidth={1.8} />
					</span>
					<span>Lobby</span>
				</button>

				<button
					type="button"
					className={`bottom-item add-button ${!isLoggedIn ? "locked" : ""}`}
					onClick={handleCenterAction}
					title={isLoggedIn ? "Agregar proyecto" : "Iniciar sesión"}
				>
					<span>
						{isLoggedIn ? (
							<Plus size={25} strokeWidth={1.8} />
						) : (
							<LockKeyhole size={23} strokeWidth={1.8} />
						)}
					</span>
				</button>

				<button type="button" className="bottom-item">
					<span className="bottom-icon">
						<FlaskConical size={22} strokeWidth={1.8} />
					</span>
					<span>Lab</span>
				</button>

				<button
					type="button"
					className="bottom-item"
					onClick={() => {
						if (!isLoggedIn) setShowLoginModal(true);
					}}
				>
					<span className="bottom-icon">
						<UserRound size={22} strokeWidth={1.8} />
					</span>
					<span>{isLoggedIn ? "Perfil" : "Login"}</span>
				</button>
			</section>

			{showLoginModal && (
				<div className="login-modal-backdrop">
					<div className="login-modal">
						<button
							type="button"
							className="login-close"
							onClick={() => setShowLoginModal(false)}
						>
							×
						</button>

						<div className="login-icon">
							<LockKeyhole size={23} strokeWidth={1.8} />
						</div>

						<h2>Acceso privado</h2>

						<p>
							Inicia sesión para desbloquear acciones internas del Knight Lobby.
						</p>

						{loginError && (
							<p className="login-error">
								{loginError}
							</p>
						)}

						<form onSubmit={handleLoginSubmit}>
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
								Password
								<input
									type="password"
									placeholder="••••••••"
									value={loginPassword}
									onChange={(event) => setLoginPassword(event.target.value)}
									required
								/>
							</label>

							<button type="submit" disabled={loginLoading}>
								{loginLoading ? "Entrando..." : "Entrar"}
							</button>
						</form>
					</div>
				</div>
			)}

			{loading && <p className="hub-feedback">Cargando portales...</p>}

			{errorMessage && <p className="hub-feedback error">{errorMessage}</p>}

			{!loading && !errorMessage && (
				<>
					<section className="world-grid">
						{apps.map((app) => {
							const appCanOpen = canOpenApp(app);

							return (
								<article
									key={app.app_id}
									className={`world-card ${!appCanOpen ? "locked" : ""}`}
									style={{ "--portal-color": app.portal_color || "#8b5cf6" }}
								>
									<div className="world-art">
										<div className={`mini-world ${getPortalIcon(app)}`}>
											<span className="world-spark spark-a" />
											<span className="world-spark spark-b" />
											<span className="world-spark spark-c" />

											<div className="tree tree-left" />
											<div className="tree tree-right" />
											<div className="rock rock-left" />
											<div className="rock rock-right" />

											<div className="main-crystal">
												<span className="facet facet-left" />
												<span className="facet facet-right" />
											</div>

											<div className="small-crystal small-left" />
											<div className="small-crystal small-right" />

											<div className="island-top" />
											<div className="island-bottom" />
										</div>
									</div>

									<div className="world-info">
										<h3>{app.name}</h3>
										<p>{app.description}</p>

										<span className={`world-status ${app.status}`}>
											{getStatusLabel(app.status)}
										</span>

										<button
											type="button"
											className={`world-button ${!appCanOpen ? "disabled" : ""}`}
											disabled={app.is_locked || app.status === "coming_soon"}
											onClick={() => handleOpenApp(app)}
										>
											{!appCanOpen ? (
												<>
													<span className="button-lock">
														<LockKeyhole size={23} strokeWidth={1.8} />
													</span>
													<span>{getButtonLabel(app)}</span>
												</>
											) : (
												<>
													<span>{getButtonLabel(app)}</span>
													<span className="button-arrow">→</span>
												</>
											)}
										</button>
									</div>
								</article>
							);
						})}
					</section>

					<section className="ecosystem-card">
						<div className="ecosystem-icon">✦</div>

						<div className="ecosystem-content">
							<div className="ecosystem-row">
								<span>Progreso del ecosistema</span>
								<strong>{ecosystemProgress}%</strong>
							</div>

							<div className="ecosystem-bar">
								<div
									className="ecosystem-fill"
									style={{ width: `${ecosystemProgress}%` }}
								/>
							</div>
						</div>
					</section>
				</>
			)}
		</main>
	);
}

export default App;