import { useEffect, useState } from "react";
import {
	BarChart3,
	Bell,
	BriefcaseBusiness,
	CalendarCheck,
	ChevronRight,
	Heart,
	Home,
	Lock,
	LogOut,
	Menu,
	PiggyBank,
	Plus,
	Shirt,
	Sparkles,
	Swords,
	WalletCards,
} from "lucide-react";
import { getMe, loginUser } from "./api/authApi";
import {
	player,
	priorities,
	progressStats,
} from "./data/mockLevelupData";
import Toast from "./components/Toast";
import LifeAreaDetailView from "./components/LifeAreaDetailView";
import PlayerAvatar from "./components/PlayerAvatar";
import AvatarCustomizationView from "./components/AvatarCustomizationView";
import {
	createLifeArea,
	getAvatarConfig,
	getAvatarItems,
	getLifeAreas,
	saveAvatarConfig,
} from "./services/api";
import "./App.css";

function App() {
	const [authToken, setAuthToken] = useState(localStorage.getItem("knight_token"));
	const [authUser, setAuthUser] = useState(null);
	const [checkingSession, setCheckingSession] = useState(Boolean(authToken));

	const [loginEmail, setLoginEmail] = useState("");
	const [loginPassword, setLoginPassword] = useState("");
	const [loginError, setLoginError] = useState("");
	const [loginLoading, setLoginLoading] = useState(false);

	const [showAvatarMenu, setShowAvatarMenu] = useState(false);
	const [avatarCategory, setAvatarCategory] = useState("shirts");

	const [avatarItems, setAvatarItems] = useState({
		caps: [],
		shirts: [],
		legs: [],
		feets: [],
		bags: [],
	});

	const [avatarConfig, setAvatarConfig] = useState({
		cap: "cap_01",
		shirt: "shirt_01",
		legs: "legs_01",
		feets: "feets_01",
		bag: null,
	});

	const [showAreasMenu, setShowAreasMenu] = useState(false);
	const [showQuickAddMenu, setShowQuickAddMenu] = useState(false);

	const [showAreaForm, setShowAreaForm] = useState(false);
	const [areaName, setAreaName] = useState("");
	const [areaIcon, setAreaIcon] = useState("✨");
	const [areaColor, setAreaColor] = useState("#7a58b4");
	const [areaDescription, setAreaDescription] = useState("");
	const [areaError, setAreaError] = useState("");
	const [areaSaving, setAreaSaving] = useState(false);

	const [toast, setToast] = useState(null);
	const [currentTime, setCurrentTime] = useState("");

	const [lifeAreas, setLifeAreas] = useState([]);
	const [lifeAreasLoading, setLifeAreasLoading] = useState(false);

	const [currentView, setCurrentView] = useState("dashboard");
	const [selectedLifeArea, setSelectedLifeArea] = useState(null);

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

	useEffect(() => {
		async function loadLifeAreas() {
			if (!authUser?.user_id) return;

			setLifeAreasLoading(true);

			try {
				const result = await getLifeAreas(authUser.user_id);

				if (result.success) {
					setLifeAreas(result.data || []);
				}
			} catch (error) {
				console.error("Could not load life areas:", error);
				setLifeAreas([]);
			} finally {
				setLifeAreasLoading(false);
			}
		}

		loadLifeAreas();
	}, [authUser]);

	useEffect(() => {
		function updateClock() {
			const now = new Date();

			const formattedTime = now.toLocaleTimeString("sv-SE", {
				hour: "2-digit",
				minute: "2-digit",
			});

			setCurrentTime(formattedTime);
		}

		updateClock();

		const clockInterval = setInterval(updateClock, 1000);

		return () => clearInterval(clockInterval);
	}, []);

	useEffect(() => {
		async function loadAvatarItems() {
			if (!authUser?.user_id) return;

			try {
				const result = await getAvatarItems();

				if (result.success) {
					setAvatarItems({
						caps: result.data.caps || [],
						shirts: result.data.shirts || [],
						legs: result.data.legs || [],
						feets: result.data.feets || [],
						bags: result.data.bags || [],
					});
				}

				const configResult = await getAvatarConfig(authUser.user_id);

				if (configResult.success) {
					setAvatarConfig((currentConfig) => ({
						...currentConfig,
						...configResult.data.avatar_config,
					}));
				}
			} catch (error) {
				console.error("Could not load avatar items:", error);
			}
		}

		loadAvatarItems();
	}, [authUser]);

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
		setShowAreasMenu(false);
		setShowQuickAddMenu(false);
		setShowAreaForm(false);
		setShowAvatarMenu(false);
		setToast(null);
	}

	function createSlug(text) {
		return text
			.toLowerCase()
			.trim()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "");
	}

	function handleToggleAreasMenu() {
		setShowQuickAddMenu(false);
		setShowAvatarMenu(false);
		setShowAreasMenu((currentValue) => !currentValue);
	}

	function handleToggleQuickAddMenu() {
		setShowAreasMenu(false);
		setShowAvatarMenu(false);
		setShowQuickAddMenu((currentValue) => !currentValue);
	}

	function handleQuickAddAction(action) {
		setShowQuickAddMenu(false);

		if (action === "area") {
			setAreaError("");
			setAreaName("");
			setAreaIcon("✨");
			setAreaColor("#7a58b4");
			setAreaDescription("");
			setShowAreaForm(true);
			return;
		}

		console.log("Acción rápida:", action);
	}

	function handleSelectArea(area) {
		setSelectedLifeArea(area);
		setCurrentView("life-area-detail");
		setShowAreasMenu(false);
		setShowQuickAddMenu(false);
		setShowAvatarMenu(false);
	}

	async function handleCreateAreaSubmit(event) {
		event.preventDefault();

		if (!authUser?.user_id) {
			setAreaError("No se pudo identificar el usuario.");
			return;
		}

		if (!areaName.trim()) {
			setAreaError("El nombre del área es obligatorio.");
			return;
		}

		setAreaError("");
		setAreaSaving(true);

		try {
			const slug = createSlug(areaName);

			const areaAlreadyExists = lifeAreas.some(
				(area) => area.slug === slug
			);

			if (areaAlreadyExists) {
				setAreaError("Ya tienes un área con ese nombre. Usa un nombre diferente.");
				setAreaSaving(false);
				return;
			}

			const newArea = {
				user_id: authUser.user_id,
				name: areaName.trim(),
				slug: slug,
				icon: areaIcon.trim() || "✨",
				description: areaDescription.trim() || null,
				color: areaColor || "#7a58b4",
				sort_order: lifeAreas.length + 1,
			};

			await createLifeArea(newArea);

			const result = await getLifeAreas(authUser.user_id);

			if (result.success) {
				setLifeAreas(result.data || []);
			}

			setShowAreaForm(false);
			setAreaName("");
			setAreaIcon("✨");
			setAreaColor("#7a58b4");
			setAreaDescription("");

			showToast(
				"Área creada",
				"Tu nueva área de vida fue agregada correctamente.",
				"success"
			);
		} catch (error) {
			const message = error.message || "";

			if (
				message.includes("duplicate key") ||
				message.includes("life_areas_user_id_slug_key") ||
				message.includes("already exists")
			) {
				setAreaError("Ya existe un área con ese nombre. Prueba con otro nombre.");
				
				showToast(
					"Área duplicada",
					"Ya existe un área con ese nombre.",
					"error"
				);

				return;
			}

			setAreaError("No pudimos guardar el área. Revisa los datos e inténtalo otra vez.");
		} finally {
			setAreaSaving(false);
		}
	}

	function handleToggleAvatarMenu() {
		setShowAreasMenu(false);
		setShowQuickAddMenu(false);
		setShowAvatarMenu((currentValue) => !currentValue);
	}

	async function handleChangeAvatarPart(part, value) {
		if (!authUser?.user_id) return;

		const previousValue = avatarConfig[part];

		setAvatarConfig((currentConfig) => ({
			...currentConfig,
			[part]: value,
		}));

		try {
			await saveAvatarConfig(authUser.user_id, value);
		} catch (error) {
			console.error("Could not save avatar config:", error);

			setAvatarConfig((currentConfig) => ({
				...currentConfig,
				[part]: previousValue,
			}));

			showToast(
				"No se pudo guardar",
				"El cambio del avatar no se pudo guardar.",
				"error"
			);
		}
	}

	function showToast(title, message = "", type = "success") {
		setToast({
			title,
			message,
			type,
		});

		setTimeout(() => {
			setToast(null);
		}, 3200);
	}

	function handleBackToDashboard() {
		setCurrentView("dashboard");
		setSelectedLifeArea(null);
		setShowAreasMenu(false);
		setShowQuickAddMenu(false);
	}

	function getSelectedAvatarImages() {
		const selectedCap = avatarItems.caps.find(
			(item) => item.item_key === avatarConfig.cap
		);

		const selectedShirt = avatarItems.shirts.find(
			(item) => item.item_key === avatarConfig.shirt
		);

		const selectedLegs = avatarItems.legs.find(
			(item) => item.item_key === avatarConfig.legs
		);

		const selectedFeets = avatarItems.feets.find(
			(item) => item.item_key === avatarConfig.feets
		);

		const selectedBag = avatarItems.bags.find(
			(item) => item.item_key === avatarConfig.bag
		);

		return {
			cap: selectedCap?.image_url,
			shirt: selectedShirt?.image_url,
			legs: selectedLegs?.image_url,
			feets: selectedFeets?.image_url,
			bag: selectedBag?.image_url,
		};
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

						<h1>LevelUp Life</h1>
						<p className="login-kicker">Life as a video game</p>
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

	const isAreasActive = showAreasMenu || currentView === "life-area-detail";

	return (
		<main className="levelup-shell">
			<header className="levelup-topbar">
				<button type="button" className="icon-button">
					<Menu size={27} strokeWidth={1.8} />
				</button>

				<h1>LevelUp Life</h1>

				<button type="button" className="icon-button notification-button">
					<Bell size={24} strokeWidth={1.8} />
					<span />
				</button>
			</header>

			{currentView === "dashboard" && (
				<section className="dashboard-reposition">
					<section className="player-card">
						<div className="player-info">
							<div className="clock-card">
								<strong>{currentTime}</strong>
							</div>

							<div className="day-progress-widget">
								<p>☀ Progreso del día</p>
								<div className="progress-circle">
									<span>{player.dayProgress}</span>
									<small>%</small>
								</div>
								<p className="progress-note">¡Sigue así!</p>
							</div>

							<div className="time-progress-inline">
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
							</div>
						</div>

						<div className="avatar-zone">
							<div className="life-status-card">
								<div className="level-badge">
									<span>NIVEL</span>
									<strong>{player.level}</strong>
								</div>

								<div className="life-row">
									<strong>Vida:</strong>
									<div className="heart-row">
										{Array.from({ length: 5 }).map((_, index) => (
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
							</div>

							<button
								type="button"
								className={`avatar-clothes-button ${showAvatarMenu ? "active" : ""}`}
								onClick={handleToggleAvatarMenu}
								aria-label="Personalizar avatar"
							>
								<Shirt size={21} strokeWidth={1.9} />
							</button>

							<div className="avatar-display">
								<PlayerAvatar avatarImages={getSelectedAvatarImages()} />
							</div>

							<h2>{displayName}</h2>

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

							<div className="ai-card">
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
							</div>
						</div>
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
				</section>
			)}

			{currentView === "life-area-detail" && (
				<LifeAreaDetailView
					area={selectedLifeArea}
					onBack={handleBackToDashboard}
				/>
			)}

			{showAreasMenu && (
				<div className="areas-floating-menu">
					<div className="areas-floating-header">
						<strong>Áreas de Vida</strong>
						<button type="button" onClick={() => setShowAreasMenu(false)}>
							×
						</button>
					</div>

					<div className="areas-floating-list">
						{lifeAreasLoading && (
							<p className="areas-floating-message">Cargando áreas...</p>
						)}

						{!lifeAreasLoading && lifeAreas.length === 0 && (
							<p className="areas-floating-message">
								Todavía no tienes áreas creadas.
							</p>
						)}

						{!lifeAreasLoading &&
							lifeAreas.map((area) => (
								<button
									type="button"
									className="areas-floating-item"
									key={area.life_area_id}
									onClick={() => handleSelectArea(area)}
								>
									<span className="areas-floating-icon">{area.icon}</span>
									<span>{area.name}</span>
									<ChevronRight size={20} strokeWidth={1.8} />
								</button>
							))
						}
					</div>
				</div>
			)}

			{showQuickAddMenu && (
				<div className="quick-add-menu">
					<div className="quick-add-header">
						<strong>Crear nuevo</strong>

						<button
							type="button"
							onClick={() => setShowQuickAddMenu(false)}
							aria-label="Cerrar menú"
						>
							×
						</button>
					</div>

					<div className="quick-add-list">
						<button
							type="button"
							className="quick-add-item"
							onClick={() => handleQuickAddAction("area")}
						>
							<span className="quick-add-icon">🌍</span>
							<span>
								<strong>Nueva área</strong>
								<small>Crea un reino de tu vida</small>
							</span>
						</button>

						<button
							type="button"
							className="quick-add-item"
							onClick={() => handleQuickAddAction("goal")}
						>
							<span className="quick-add-icon">🏆</span>
							<span>
								<strong>Nuevo objetivo</strong>
								<small>Meta grande con progreso</small>
							</span>
						</button>

						<button
							type="button"
							className="quick-add-item"
							onClick={() => handleQuickAddAction("habit")}
						>
							<span className="quick-add-icon">🔥</span>
							<span>
								<strong>Nuevo hábito</strong>
								<small>Acción repetible para subir nivel</small>
							</span>
						</button>

						<button
							type="button"
							className="quick-add-item"
							onClick={() => handleQuickAddAction("mission")}
						>
							<span className="quick-add-icon">⚔️</span>
							<span>
								<strong>Nueva misión</strong>
								<small>Tarea o pendiente importante</small>
							</span>
						</button>
					</div>
				</div>
			)}

			{showAreaForm && (
				<div className="area-form-backdrop">
					<section className="area-form-modal">
						<div className="area-form-header">
							<div>
								<span>Nueva área</span>
								<h2>Crear Área de Vida</h2>
							</div>

							<button
								type="button"
								onClick={() => {
									setShowAreaForm(false);
									setAreaError("");
								}}
								aria-label="Cerrar formulario"
							>
								×
							</button>
						</div>

						<form className="area-form" onSubmit={handleCreateAreaSubmit}>
							<label>
								Nombre del área
								<input
									type="text"
									placeholder="Ej: Salud Física"
									value={areaName}
									onChange={(event) => setAreaName(event.target.value)}
									required
								/>
							</label>

							<div className="area-form-row">
								<label>
									Icono
									<input
										type="text"
										placeholder="💪"
										value={areaIcon}
										onChange={(event) => setAreaIcon(event.target.value)}
										maxLength={4}
									/>
								</label>

								<label>
									Color
									<input
										type="color"
										value={areaColor}
										onChange={(event) => setAreaColor(event.target.value)}
									/>
								</label>
							</div>

							<label>
								Descripción
								<textarea
									placeholder="Describe qué representa esta área en tu vida..."
									value={areaDescription}
									onChange={(event) => setAreaDescription(event.target.value)}
									rows={4}
								/>
							</label>

							{areaError && (
								<p className="area-form-error">
									{areaError}
								</p>
							)}

							<button type="submit" disabled={areaSaving}>
								{areaSaving ? "Guardando..." : "Guardar área"}
							</button>
						</form>
					</section>
				</div>
			)}

			{showAvatarMenu && (
				<AvatarCustomizationView
					player={player}
					avatarConfig={avatarConfig}
					avatarItems={avatarItems}
					avatarImages={getSelectedAvatarImages()}
					avatarCategory={avatarCategory}
					setAvatarCategory={setAvatarCategory}
					handleChangeAvatarPart={handleChangeAvatarPart}
					onClose={() => setShowAvatarMenu(false)}
				/>
			)}

			<Toast toast={toast} onClose={() => setToast(null)} />

			<nav className="levelup-bottom-nav">
				<button
					type="button"
					className={currentView === "dashboard" ? "active" : ""}
					onClick={handleBackToDashboard}
				>
					<HomeIcon />
					<span>Inicio</span>
				</button>

				<button
					type="button"
					className={isAreasActive ? "active" : ""}
					onClick={handleToggleAreasMenu}
				>
					<BarChart3 size={24} strokeWidth={1.8} />
					<span>Áreas</span>
				</button>

				<button
					type="button"
					className={`nav-plus ${showQuickAddMenu ? "active" : ""}`}
					onClick={handleToggleQuickAddMenu}
				>
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