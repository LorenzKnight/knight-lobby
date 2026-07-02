import { useEffect, useRef, useState } from "react";
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
import TamagotchiReminder from "./components/TamagotchiReminder";
import LifeAreaDetailView from "./components/LifeAreaDetailView";
import PlayerAvatar from "./components/PlayerAvatar";
import AvatarCustomizationView from "./components/AvatarCustomizationView";
import {
	addReward,
	checkDailyGoalReminders,
	completeDailyGoalTask,
	createDailyGoal,
	createLifeArea,
	getAvatarConfig,
	getAvatarItems,
	getDailyGoals,
	getGameProfile,
	getLifeAreas,
	progressDailyGoalTask,
	saveAvatarConfig,
} from "./services/api";
import "./App.css";

/**
 * @typedef {{
 *   id: string;
 *   title: string;
 *   message: string;
 *   type: string;
 * }} AppToast
 */

function App() {
	const [authToken, setAuthToken] = useState(localStorage.getItem("knight_token"));
	const [authUser, setAuthUser] = useState(null);
	const [checkingSession, setCheckingSession] = useState(Boolean(authToken));

	const [loginEmail, setLoginEmail] = useState("");
	const [loginPassword, setLoginPassword] = useState("");
	const [loginError, setLoginError] = useState("");
	const [loginLoading, setLoginLoading] = useState(false);

	const [gameProfile, setGameProfile] = useState(null);
	const [gameProfileLoading, setGameProfileLoading] = useState(false);

	const [showAvatarMenu, setShowAvatarMenu] = useState(false);
	const [avatarCategory, setAvatarCategory] = useState("shirts");

	const [dailyGoals, setDailyGoals] = useState([]);
	const [dailyGoalsLoading, setDailyGoalsLoading] = useState(false);
	const [completingTaskId, setCompletingTaskId] = useState(null);
	
	const dailyGoalsPreviewRef = useRef(null);
	const [selectedDailyGoalId, setSelectedDailyGoalId] = useState(null);
	const [dailyGoalMenuArrowTop, setDailyGoalMenuArrowTop] = useState(40);

	const [showDailyGoalForm, setShowDailyGoalForm] = useState(false);
	const [dailyGoalError, setDailyGoalError] = useState("");
	const [dailyGoalSaving, setDailyGoalSaving] = useState(false);

	const [dailyGoalTitle, setDailyGoalTitle] = useState("");
	const [dailyGoalDescription, setDailyGoalDescription] = useState("");
	const [dailyGoalLifeAreaId, setDailyGoalLifeAreaId] = useState("");

	const [dailyGoalTaskTitle, setDailyGoalTaskTitle] = useState("");
	const [dailyGoalProgressType, setDailyGoalProgressType] = useState("checkbox");
	const [dailyGoalTargetValue, setDailyGoalTargetValue] = useState(1);
	const [dailyGoalStepValue, setDailyGoalStepValue] = useState(1);
	const [dailyGoalUnit, setDailyGoalUnit] = useState("task");

	const [dailyGoalReminderEnabled, setDailyGoalReminderEnabled] = useState(true);
	const [dailyGoalReminderIntervalMinutes, setDailyGoalReminderIntervalMinutes] = useState(120);
	const [dailyGoalReminderStartTime, setDailyGoalReminderStartTime] = useState("08:00");
	const [dailyGoalReminderEndTime, setDailyGoalReminderEndTime] = useState("22:00");

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

	/** @type {[AppToast[], Function]} */
	const [toastQueue, setToastQueue] = useState([]);

	/** @type {[AppToast | null, Function]} */
	const [activeToast, setActiveToast] = useState(null);

	const [reminderQueue, setReminderQueue] = useState([]);
	const [activeReminder, setActiveReminder] = useState(null);

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
		async function loadGameProfile() {
			if (!authUser?.user_id) return;

			setGameProfileLoading(true);

			try {
				const result = await getGameProfile(authUser.user_id);

				if (result.success) {
					setGameProfile(result.data);
				}
			} catch (error) {
				console.error("Could not load game profile:", error);
				setGameProfile(null);
			} finally {
				setGameProfileLoading(false);
			}
		}

		loadGameProfile();
	}, [authUser]);

	useEffect(() => {
		async function loadDailyGoals() {
			if (!authUser?.user_id) return;

			setDailyGoalsLoading(true);

			try {
				const result = await getDailyGoals(authUser.user_id);

				if (result.success) {
					setDailyGoals(result.data || []);
				}
			} catch (error) {
				console.error("Could not load daily goals:", error);
				setDailyGoals([]);
			} finally {
				setDailyGoalsLoading(false);
			}
		}

		loadDailyGoals();
	}, [authUser]);

	useEffect(() => {
		if (!authUser?.user_id) return;

		let isMounted = true;

		async function loadDailyGoalReminders() {
			try {
				const result = await checkDailyGoalReminders(authUser.user_id);

				if (!isMounted || !result.success) return;

				const notifications = result.data || [];

				notifications.forEach((notification) => {
					showTamagotchiReminder(
						notification.title,
						notification.message,
						notification.icon || "🔔"
					);
				});
			} catch (error) {
				console.error("Could not check daily goal reminders:", error);
			}
		}

		loadDailyGoalReminders();

		const reminderInterval = setInterval(() => {
			loadDailyGoalReminders();
		}, 60000);

		return () => {
			isMounted = false;
			clearInterval(reminderInterval);
		};
	}, [authUser]);

	useEffect(() => {
		if (activeToast || toastQueue.length === 0) return;

		const timeout = setTimeout(() => {
			const nextToast = toastQueue[0];

			setActiveToast(nextToast);
			setToastQueue((currentQueue) => currentQueue.slice(1));
		}, 0);

		return () => clearTimeout(timeout);
	}, [activeToast, toastQueue]);

	useEffect(() => {
		if (!activeToast) return;

		const timeout = setTimeout(() => {
			setActiveToast(null);
		}, 3200);

		return () => clearTimeout(timeout);
	}, [activeToast]);

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

	useEffect(() => {
		function handleEscapeKey(event) {
			if (event.key === "Escape") {
				closeFloatingMenus();
			}
		}

		document.addEventListener("keydown", handleEscapeKey);

		return () => {
			document.removeEventListener("keydown", handleEscapeKey);
		};
	}, []);

	useEffect(() => {
		if (activeReminder || reminderQueue.length === 0) return;

		const timeout = setTimeout(() => {
			const nextReminder = reminderQueue[0];

			setActiveReminder(nextReminder);
			setReminderQueue((currentQueue) => currentQueue.slice(1));
		}, 0);

		return () => clearTimeout(timeout);
	}, [activeReminder, reminderQueue]);

	function closeFloatingMenus() {
		setSelectedDailyGoalId(null);
		setShowQuickAddMenu(false);
		setShowAreasMenu(false);
		setShowAvatarMenu(false);
		setShowAreaForm(false);
		setShowDailyGoalForm(false);
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
		setGameProfile(null);
		setDailyGoals([]);
		setSelectedDailyGoalId(null);
		setShowAreasMenu(false);
		setShowQuickAddMenu(false);
		setShowAreaForm(false);
		setShowDailyGoalForm(false);
		setShowAvatarMenu(false);
		setActiveToast(null);
		setToastQueue([]);
		setActiveReminder(null);
		setReminderQueue([]);
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
		setSelectedDailyGoalId(null);
		setShowQuickAddMenu(false);
		setShowAvatarMenu(false);

		setShowAreasMenu((currentValue) => !currentValue);
	}

	function handleToggleQuickAddMenu() {
		setSelectedDailyGoalId(null);
		setShowAreasMenu(false);
		setShowAvatarMenu(false);

		setShowQuickAddMenu((currentValue) => !currentValue);
	}

	function handleQuickAddAction(action) {
		setSelectedDailyGoalId(null);
		setShowQuickAddMenu(false);
		setShowAreasMenu(false);
		setShowAvatarMenu(false);

		if (action === "area") {
			setAreaError("");
			setAreaName("");
			setAreaIcon("✨");
			setAreaColor("#7a58b4");
			setAreaDescription("");

			setShowDailyGoalForm(false);
			setShowAreaForm(true);
			return;
		}

		if (action === "daily_goal") {
			setDailyGoalError("");

			setDailyGoalTitle("");
			setDailyGoalDescription("");
			setDailyGoalLifeAreaId("");

			setDailyGoalTaskTitle("");
			setDailyGoalProgressType("checkbox");
			setDailyGoalTargetValue(1);
			setDailyGoalStepValue(1);
			setDailyGoalUnit("task");

			setDailyGoalReminderEnabled(true);
			setDailyGoalReminderIntervalMinutes(120);
			setDailyGoalReminderStartTime("08:00");
			setDailyGoalReminderEndTime("22:00");

			setShowAreaForm(false);
			setShowDailyGoalForm(true);
			return;
		}

		console.log("Acción rápida:", action);
	}

	function handleSelectArea(area) {
		setSelectedDailyGoalId(null);
		setSelectedLifeArea(area);
		setCurrentView("life-area-detail");
		setShowAreasMenu(false);
		setShowQuickAddMenu(false);
		setShowAvatarMenu(false);
	}

	async function handleCreateDailyGoalSubmit(event) {
		event.preventDefault();

		if (!authUser?.user_id) {
			setDailyGoalError("No se pudo identificar el usuario.");
			return;
		}

		if (!dailyGoalTitle.trim()) {
			setDailyGoalError("Escribe el nombre del hábito diario.");
			return;
		}

		if (!dailyGoalTaskTitle.trim()) {
			setDailyGoalError("Escribe la tarea diaria.");
			return;
		}

		if (Number(dailyGoalTargetValue) <= 0) {
			setDailyGoalError("La meta total debe ser mayor que cero.");
			return;
		}

		if (Number(dailyGoalStepValue) <= 0) {
			setDailyGoalError("El avance por click debe ser mayor que cero.");
			return;
		}

		if (
			dailyGoalReminderEnabled &&
			Number(dailyGoalReminderIntervalMinutes) <= 0
		) {
			setDailyGoalError("El intervalo del recordatorio debe ser mayor que cero.");
			return;
		}

		setDailyGoalError("");
		setDailyGoalSaving(true);

		try {
			const payload = {
				user_id: authUser.user_id,
				life_area_id: dailyGoalLifeAreaId
					? Number(dailyGoalLifeAreaId)
					: null,

				title: dailyGoalTitle.trim(),
				description: dailyGoalDescription.trim() || null,

				task_title: dailyGoalTaskTitle.trim(),
				task_description: null,

				progress_type: dailyGoalProgressType,
				target_value: Number(dailyGoalTargetValue),
				step_value: Number(dailyGoalStepValue),
				unit: dailyGoalUnit.trim() || "task",

				exp_reward: 10,
				coins_reward: 2,
				gems_reward: 0,
				sort_order: dailyGoals.length + 1,

				reminder_enabled: dailyGoalReminderEnabled,
				reminder_interval_minutes: dailyGoalReminderEnabled
					? Number(dailyGoalReminderIntervalMinutes)
					: null,
				reminder_start_time: dailyGoalReminderEnabled
					? dailyGoalReminderStartTime
					: null,
				reminder_end_time: dailyGoalReminderEnabled
					? dailyGoalReminderEndTime
					: null,
			};

			const result = await createDailyGoal(payload);

			if (result.success) {
				const goalsResult = await getDailyGoals(authUser.user_id);

				if (goalsResult.success) {
					setDailyGoals(goalsResult.data || []);
				}

				setShowDailyGoalForm(false);

				showToast(
					"Hábito diario creado",
					"Tu nuevo hábito diario fue agregado correctamente.",
					"success"
				);
			}
		} catch (error) {
			console.error("Could not create daily goal:", error);

			setDailyGoalError(
				error.message || "No pudimos guardar el hábito diario."
			);
		} finally {
			setDailyGoalSaving(false);
		}
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
		setSelectedDailyGoalId(null);
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
		const newToast = {
			id: crypto.randomUUID(),
			title,
			message,
			type,
		};

		setToastQueue((currentQueue) => [
			...currentQueue,
			newToast,
		]);
	}

	function showTamagotchiReminder(title, message = "", icon = "🔔") {
		const newReminder = {
			id: crypto.randomUUID(),
			title,
			message,
			icon,
		};

		setReminderQueue((currentQueue) => [
			...currentQueue,
			newReminder,
		]);
	}

	async function handleTestReward() {
		if (!authUser?.user_id) return;

		try {
			const result = await addReward({
				user_id: authUser.user_id,
				source_type: "manual_test",
				source_id: null,
				exp_earned: 10,
				coins_earned: 2,
				gems_earned: 0,
				reason: "Recompensa de prueba desde el dashboard",
			});

			if (result.success) {
				setGameProfile((currentProfile) => ({
					...currentProfile,
					...result.data,
				}));

				showToast(
					result.data.leveled_up ? "¡Subiste de nivel!" : "Recompensa ganada",
					"+10 EXP y +2 monedas",
					"success"
				);
			}
		} catch (error) {
			console.error("Could not apply test reward:", error);

			showToast(
				"No se pudo aplicar",
				"La recompensa no se pudo guardar.",
				"error"
			);
		}
	}

	async function handleCompleteDailyGoalTask(goalId, taskId) {
		if (!authUser?.user_id || completingTaskId) return;

		setCompletingTaskId(taskId);

		try {
			const result = await completeDailyGoalTask({
				user_id: authUser.user_id,
				daily_goal_id: goalId,
				daily_goal_task_id: taskId,
			});

			if (!result.success) return;

			const goalsResult = await getDailyGoals(authUser.user_id);

			if (goalsResult.success) {
				setDailyGoals(goalsResult.data || []);
			}

			if (result.data.reward_applied && result.data.game_profile) {
				setGameProfile((currentProfile) => ({
					...currentProfile,
					...result.data.game_profile,
				}));

				showToast(
					result.data.game_profile.leveled_up
						? "¡Subiste de nivel!"
						: "¡Día completado!",
					"Has completado todos tus objetivos diarios.",
					"success"
				);

				return;
			}

			if (result.data.daily_goal_completed) {
				showToast(
					"Objetivo completado",
					"Este objetivo diario fue completado.",
					"success"
				);

				return;
			}

			showToast(
				"Tarea completada",
				`Progreso: ${result.data.progress_text}`,
				"success"
			);
		} catch (error) {
			console.error("Could not complete daily goal task:", error);

			showToast(
				"No se pudo completar",
				"La tarea no pudo guardarse.",
				"error"
			);
		} finally {
			setCompletingTaskId(null);
		}
	}

	async function handleProgressDailyGoalTask(goalId, task) {
		if (!authUser?.user_id || completingTaskId) return;

		setCompletingTaskId(task.daily_goal_task_id);

		try {
			const result = await progressDailyGoalTask({
				user_id: authUser.user_id,
				daily_goal_id: goalId,
				daily_goal_task_id: task.daily_goal_task_id,
				progress_amount: Number(task.step_value || 1),
			});

			if (!result.success) return;

			const goalsResult = await getDailyGoals(authUser.user_id);

			if (goalsResult.success) {
				setDailyGoals(goalsResult.data || []);
			}

			if (result.data.reward_applied && result.data.game_profile) {
				setGameProfile((currentProfile) => ({
					...currentProfile,
					...result.data.game_profile,
				}));

				showToast(
					result.data.game_profile.leveled_up
						? "¡Subiste de nivel!"
						: "¡Día completado!",
					"Has completado todos tus hábitos diarios.",
					"success"
				);

				return;
			}

			if (result.data.daily_goal_completed) {
				showToast(
					"Hábito completado",
					"Este hábito diario fue completado.",
					"success"
				);

				return;
			}

			showToast(
				"Progreso actualizado",
				result.data.task_progress_text,
				"success"
			);
		} catch (error) {
			console.error("Could not update daily goal progress:", error);

			showToast(
				"No se pudo actualizar",
				"La tarea no pudo guardar el progreso.",
				"error"
			);
		} finally {
			setCompletingTaskId(null);
		}
	}

	function handleOpenDailyGoalMenu(goalId, event) {
		setShowQuickAddMenu(false);
		setShowAreasMenu(false);
		setShowAvatarMenu(false);

		const previewElement = dailyGoalsPreviewRef.current;
		const clickedElement = event.currentTarget;

		if (previewElement && clickedElement) {
			const previewRect = previewElement.getBoundingClientRect();
			const clickedRect = clickedElement.getBoundingClientRect();

			const arrowTop =
				clickedRect.top -
				previewRect.top +
				clickedRect.height / 2;

			setDailyGoalMenuArrowTop(arrowTop);
		}

		setSelectedDailyGoalId((currentId) =>
			currentId === goalId ? null : goalId
		);
	}

	function handleBackToDashboard() {
		setCurrentView("dashboard");
		setSelectedLifeArea(null);
		setSelectedDailyGoalId(null);
		setShowAreasMenu(false);
		setShowQuickAddMenu(false);
		setShowAvatarMenu(false);
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

	function handleCloseReminder() {
		setActiveReminder(null);
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
							Organize your life like a video game: habits, areas,
							Progress and daily missions.
						</p>
					</div>

					<form className="levelup-login-form" onSubmit={handleLoginSubmit}>
						<label>
							Email
							<input
								type="email"
								placeholder="your@email.com"
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

						{loginError && <p className="login-error">{loginError}</p>}

						<button type="submit" disabled={loginLoading}>
							{loginLoading ? "Entering..." : "Entering my life"}
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

	const displayPlayer = {
		...player,
		level: gameProfile?.level ?? player.level,
		exp: gameProfile?.exp_percent ?? player.exp,
		nextLevelExp: gameProfile
			? `${gameProfile.current_exp} / ${gameProfile.required_exp}`
			: player.nextLevelExp,
		coins: gameProfile?.coins ?? player.coins,
		gems: gameProfile?.gems ?? player.gems,
		life: gameProfile?.current_life ?? player.life,
		maxLife: gameProfile?.max_life ?? player.maxLife,
	};

	const expPercent = Math.min(Math.max(displayPlayer.exp, 0), 100);

	const totalDailyTasks = dailyGoals.reduce(
		(total, goal) => total + (goal.total_tasks || 0),
		0
	);

	const completedDailyTasks = dailyGoals.reduce(
		(total, goal) => total + (goal.completed_tasks || 0),
		0
	);

	const totalDailyTaskProgress = dailyGoals.reduce((total, goal) => {
		const tasks = goal.tasks || [];

		const goalTaskProgress = tasks.reduce((taskTotal, task) => {
			return taskTotal + (task.task_progress_percent || 0);
		}, 0);

		return total + goalTaskProgress;
	}, 0);

	const dailyProgressPercent =
		totalDailyTasks > 0
			? Math.round(totalDailyTaskProgress / totalDailyTasks)
			: 0;

	const isAreasActive = showAreasMenu || currentView === "life-area-detail";

	const selectedDailyGoal = dailyGoals.find(
		(goal) => goal.daily_goal_id === selectedDailyGoalId
	);

	return (
		<main className="levelup-shell">
			<header className="levelup-topbar">
				<button
					type="button"
					className="icon-button"
					onClick={closeFloatingMenus}
				>
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
						<div className="day-progress-card">
							<div className="time-summary-card">
								<section className="current-time-section">
									<div className="clock-card">
										<strong>{currentTime}</strong>
									</div>
								</section>

								<section className="time-progress-inline">
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
							</div>

							<div className="day-progress-widget">
								<div className="day-progress-left">
									<small className="daily-progress-count">
										Progreso: {completedDailyTasks}/{totalDailyTasks}
									</small>

									<p className="progress-note">
										{dailyProgressPercent === 100
											? "¡Día completado!"
											: "¡Sigue así!"}
									</p>

									<div className="low-poly-mountains" aria-hidden="true">
										<span className="mountain mountain-small-left" />
										<span className="mountain mountain-center" />
										<span className="mountain mountain-tall" />
										<span className="mountain mountain-small-right" />
										<span className="mountain mountain-right" />
									</div>
								</div>

								<div className="day-progress-right">
									<p className="day-progress-title">☀ Progreso del día</p>

									<div
										className="progress-circle"
										style={{
											"--daily-progress": `${dailyProgressPercent * 3.6}deg`,
										}}
									>
										<span>
											{dailyGoalsLoading ? "..." : dailyProgressPercent}
										</span>

										{!dailyGoalsLoading && <small>%</small>}
									</div>
								</div>
							</div>

							<div className="daily-goals-preview" ref={dailyGoalsPreviewRef}>
								<div className="daily-goals-preview-header">
									<strong>Habitos u objetivos diarios</strong>
									<span>{completedDailyTasks}/{totalDailyTasks}</span>
								</div>

								<div className="daily-goals-scroll-area">
									{dailyGoalsLoading && (
										<p className="daily-goals-message">Cargando objetivos...</p>
									)}

									{!dailyGoalsLoading && dailyGoals.length === 0 && (
										<p className="daily-goals-message">
											Todavía no tienes objetivos diarios.
										</p>
									)}

									{!dailyGoalsLoading &&
										dailyGoals.map((goal) => (
											<article
												className={`daily-goal-card ${
													selectedDailyGoalId === goal.daily_goal_id ? "selected" : ""
												}`}
												key={goal.daily_goal_id}
											>
												<button
													type="button"
													className="daily-goal-summary-button"
													onClick={(event) =>
														handleOpenDailyGoalMenu(goal.daily_goal_id, event)
													}
												>
													<div className="daily-goal-card-header">
														<strong>{goal.title}</strong>
														<span>{goal.progress_percent}%</span>
													</div>

													<div className="daily-goal-mini-bar">
														<div
															style={{
																width: `${goal.progress_percent}%`,
															}}
														/>
													</div>
												</button>
											</article>
										))
									}
								</div>

								{selectedDailyGoal && (
									<div
										className="daily-goal-floating-menu"
										style={{
											"--arrow-top": `${dailyGoalMenuArrowTop}px`,
										}}
									>
										<div className="daily-goal-floating-header">
											<div>
												<strong>{selectedDailyGoal.title}</strong>
												<small>{selectedDailyGoal.progress_percent}% completado</small>
											</div>

											<button
												type="button"
												onClick={() => setSelectedDailyGoalId(null)}
												aria-label="Cerrar hábito diario"
											>
												×
											</button>
										</div>

										<div className="daily-goal-task-list">
											{selectedDailyGoal.tasks.map((task) => {
												const isNumericTask = task.progress_type === "numeric";

												return (
													<div
														className={`daily-goal-task-card ${
															task.is_completed ? "completed" : ""
														}`}
														key={task.daily_goal_task_id}
													>
														<button
															type="button"
															className={`daily-goal-task ${
																task.is_completed ? "completed" : ""
															}`}
															disabled={
																task.is_completed ||
																completingTaskId === task.daily_goal_task_id
															}
															onClick={() => {
																if (isNumericTask) {
																	handleProgressDailyGoalTask(
																		selectedDailyGoal.daily_goal_id,
																		task
																	);
																	return;
																}

																handleCompleteDailyGoalTask(
																	selectedDailyGoal.daily_goal_id,
																	task.daily_goal_task_id
																);
															}}
														>
															<span>{task.is_completed ? "✓" : "○"}</span>

															<strong>{task.title}</strong>

															<small>
																{task.is_completed
																	? "Completada"
																	: completingTaskId === task.daily_goal_task_id
																		? "Guardando..."
																		: isNumericTask
																			? `+${task.step_value} ${task.unit}`
																			: "Completar"}
															</small>
														</button>

														{isNumericTask && (
															<div className="daily-goal-task-progress">
																<div className="daily-goal-task-progress-info">
																	<span>
																		{task.task_progress_text ||
																			`0/${task.target_value} ${task.unit}`}
																	</span>

																	<strong>
																		{task.task_progress_percent || 0}%
																	</strong>
																</div>

																<div className="daily-goal-task-progress-bar">
																	<div
																		style={{
																			width: `${task.task_progress_percent || 0}%`,
																		}}
																	/>
																</div>
															</div>
														)}
													</div>
												);
											})}
										</div>
									</div>
								)}
								
							</div>
						</div>

						<div className="avatar-zone">
							<div className="life-status-card">
								<div className="level-badge">
									<span>NIVEL</span>
									<strong>{displayPlayer.level}</strong>
								</div>

								<div className="life-row">
									<strong>Vida:</strong>
									<div className="heart-row">
										{Array.from({ length: displayPlayer.maxLife }).map((_, index) => (
											<Heart
												key={index}
												size={21}
												fill={index < displayPlayer.life ? "currentColor" : "none"}
												strokeWidth={1.8}
											/>
										))}
									</div>
								</div>

								<p className="life-value">
									{displayPlayer.life} / {displayPlayer.maxLife}
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
									<div style={{ width: `${expPercent}%` }} />
								</div>
								<small>
									{gameProfileLoading
										? "Cargando EXP..."
										: `${displayPlayer.nextLevelExp} EXP (${displayPlayer.exp}%)`
									}
								</small>
							</div>

							<div className="wallet-row">
								<span>🪙 {displayPlayer.coins} Coins</span>
								<span>💎 {displayPlayer.gems} Gems</span>
							</div>

							<button
								type="button"
								className="test-reward-button"
								onClick={handleTestReward}
							>
								Ganar +25 EXP
							</button>
						</div>

						<div className="player-info">
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
							onClick={() => handleQuickAddAction("daily_goal")}
						>
							<span className="quick-add-icon">🔥</span>
							<span>
								<strong>Nuevo hábito</strong>
								<small>Tareas diaria para subir nivel</small>
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

			{showDailyGoalForm && (
				<div className="area-form-backdrop">
					<section className="area-form-modal daily-goal-form-modal">
						<div className="area-form-header daily-goal-form-header">
							<div>
								<span>Nuevo hábito diario</span>
								<h2>Crear Daily Goal</h2>
							</div>

							<button
								type="button"
								onClick={() => {
									setShowDailyGoalForm(false);
									setDailyGoalError("");
								}}
								aria-label="Cerrar formulario"
							>
								×
							</button>
						</div>

						<form
							className="area-form daily-goal-form"
							onSubmit={handleCreateDailyGoalSubmit}
						>
							<div className="daily-goal-form-scroll">
								<label>
									Área de vida
									<select
										value={dailyGoalLifeAreaId}
										onChange={(event) =>
											setDailyGoalLifeAreaId(event.target.value)
										}
									>
										<option value="">Sin área</option>

										{lifeAreas.map((area) => (
											<option
												key={area.life_area_id}
												value={area.life_area_id}
											>
												{area.icon} {area.name}
											</option>
										))}
									</select>
								</label>

								<label>
									Nombre del hábito diario
									<input
										type="text"
										placeholder="Ej: Caminar"
										value={dailyGoalTitle}
										onChange={(event) =>
											setDailyGoalTitle(event.target.value)
										}
										required
									/>
								</label>

								<label>
									Descripción
									<textarea
										placeholder="Ej: Movimiento diario para mejorar mi salud..."
										value={dailyGoalDescription}
										onChange={(event) =>
											setDailyGoalDescription(event.target.value)
										}
										rows={3}
									/>
								</label>

								<label>
									Tarea diaria
									<input
										type="text"
										placeholder="Ej: Caminar 3 km"
										value={dailyGoalTaskTitle}
										onChange={(event) =>
											setDailyGoalTaskTitle(event.target.value)
										}
										required
									/>
								</label>

								<div
									className={`area-form-row daily-goal-type-row ${
										dailyGoalProgressType === "numeric" ? "has-unit" : "simple-only"
									}`}
								>
									<label>
										Type
										<select
											value={dailyGoalProgressType}
											onChange={(event) => {
												const value = event.target.value;

												setDailyGoalProgressType(value);

												if (value === "checkbox") {
													setDailyGoalTargetValue(1);
													setDailyGoalStepValue(1);
													setDailyGoalUnit("task");
												}

												if (value === "numeric" && dailyGoalUnit === "task") {
													setDailyGoalUnit("km");
												}
											}}
										>
											<option value="checkbox">Simple</option>
											<option value="numeric">Numérico</option>
										</select>
									</label>

									{dailyGoalProgressType === "numeric" && (
										<label>
											Unidad
											<input
												type="text"
												placeholder="km, litros, minutos..."
												value={dailyGoalUnit}
												onChange={(event) =>
													setDailyGoalUnit(event.target.value)
												}
											/>
										</label>
									)}
								</div>

								{dailyGoalProgressType === "numeric" && (
									<div className="area-form-row">
										<label>
											Meta total
											<input
												type="number"
												min="0.1"
												step="0.1"
												value={dailyGoalTargetValue}
												onChange={(event) =>
													setDailyGoalTargetValue(event.target.value)
												}
											/>
										</label>

										<label>
											Adv. / click
											<input
												type="number"
												min="0.1"
												step="0.1"
												value={dailyGoalStepValue}
												onChange={(event) =>
													setDailyGoalStepValue(event.target.value)
												}
											/>
										</label>
									</div>
								)}

								<div className="daily-goal-reminder-section compact">
									<label className="daily-goal-reminder-toggle compact">
										<input
											type="checkbox"
											checked={dailyGoalReminderEnabled}
											onChange={(event) => {
												const isEnabled = event.target.checked;

												setDailyGoalReminderEnabled(isEnabled);

												if (!isEnabled) {
													setDailyGoalReminderIntervalMinutes("");
													setDailyGoalReminderStartTime("");
													setDailyGoalReminderEndTime("");
													return;
												}

												setDailyGoalReminderIntervalMinutes(120);
												setDailyGoalReminderStartTime("08:00");
												setDailyGoalReminderEndTime("22:00");
											}}
										/>

										<span>
											<strong>Recordatorios activos</strong>
											<small>
												Desmarca esta opción si no quieres que tu avatar te recuerde este hábito.
											</small>
										</span>
									</label>

									{dailyGoalReminderEnabled && (
										<div className="daily-goal-reminder-fields">
											<label>
												Cada
												<select
													value={dailyGoalReminderIntervalMinutes}
													onChange={(event) =>
														setDailyGoalReminderIntervalMinutes(event.target.value)
													}
												>
													<option value="15">15 min</option>
													<option value="30">30 min</option>
													<option value="60">1 hora</option>
													<option value="120">2 horas</option>
													<option value="180">3 horas</option>
												</select>
											</label>

											<div className="daily-goal-form-grid">
												<label>
													Desde
													<input
														type="time"
														value={dailyGoalReminderStartTime}
														onChange={(event) =>
															setDailyGoalReminderStartTime(event.target.value)
														}
													/>
												</label>

												<label>
													Hasta
													<input
														type="time"
														value={dailyGoalReminderEndTime}
														onChange={(event) =>
															setDailyGoalReminderEndTime(event.target.value)
														}
													/>
												</label>
											</div>
										</div>
									)}
								</div>

								{dailyGoalError && (
									<p className="area-form-error">
										{dailyGoalError}
									</p>
								)}
							</div>

							<div className="daily-goal-form-actions">
								<button type="submit" disabled={dailyGoalSaving}>
									{dailyGoalSaving ? "Guardando..." : "Guardar hábito diario"}
								</button>
							</div>
						</form>
					</section>
				</div>
			)}

			{showAvatarMenu && (
				<AvatarCustomizationView
					player={displayPlayer}
					avatarConfig={avatarConfig}
					avatarItems={avatarItems}
					avatarImages={getSelectedAvatarImages()}
					avatarCategory={avatarCategory}
					setAvatarCategory={setAvatarCategory}
					handleChangeAvatarPart={handleChangeAvatarPart}
					onClose={() => setShowAvatarMenu(false)}
				/>
			)}

			<Toast 
				toast={activeToast}
				onClose={() => setActiveToast(null)}
			/>

			{activeReminder && (
				<TamagotchiReminder
					reminder={activeReminder}
					onClose={handleCloseReminder}
				/>
			)}

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