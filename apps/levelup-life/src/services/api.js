const LEVELUP_API_URL = import.meta.env.VITE_LEVELUP_API_URL || import.meta.env.VITE_API_URL;

export async function testLevelupConnection() {
	const response = await fetch(`${LEVELUP_API_URL}/api/test/connection`);
	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.detail || data.message || "LevelUp API error");
	}

	return data;
}

export async function getLifeAreas(userId) {
	const response = await fetch(`${LEVELUP_API_URL}/api/life-areas?user_id=${userId}`);
	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.detail || data.message || "Could not load life areas");
	}

	return data;
}

export async function createLifeArea(areaData) {
	const response = await fetch(`${LEVELUP_API_URL}/api/life-areas`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(areaData),
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.detail || data.message || "Could not create life area");
	}

	return data;
}

export async function getAvatarItems() {
	const response = await fetch(`${LEVELUP_API_URL}/api/avatar/items`);
	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.detail || data.message || "Could not load avatar items");
	}

	return data;
}

export async function getAvatarConfig(userId) {
	const response = await fetch(
		`${LEVELUP_API_URL}/api/avatar/config?user_id=${userId}`
	);

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.detail || "Could not load avatar config");
	}

	return data;
}

export async function saveAvatarConfig(userId, itemKey) {
	const response = await fetch(`${LEVELUP_API_URL}/api/avatar/config`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			user_id: userId,
			item_key: itemKey,
		}),
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.detail || "Could not save avatar config");
	}

	return data;
}

export async function getGameProfile(userId) {
	const response = await fetch(
		`${LEVELUP_API_URL}/api/game-profile/profile?user_id=${userId}`
	);

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.detail || data.message || "Could not load game profile");
	}

	return data;
}

export async function getUserRewards(userId) {
	const response = await fetch(
		`${LEVELUP_API_URL}/api/game-profile/rewards?user_id=${userId}`
	);

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.detail || data.message || "Could not load rewards");
	}

	return data;
}

export async function addReward(rewardData) {
	const response = await fetch(`${LEVELUP_API_URL}/api/game-profile/reward`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(rewardData),
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.detail || data.message || "Could not apply reward");
	}

	return data;
}

// Loads the user's daily goals and today's progress.
export async function getDailyGoals(userId) {
	const response = await fetch(
		`${LEVELUP_API_URL}/api/daily-goals?user_id=${userId}`
	);

	const result = await response.json();

	if (!response.ok) {
		throw new Error(result.detail || "Could not load daily goals");
	}

	return result;
}


// Completes one task belonging to a daily goal.
export async function completeDailyGoalTask(data) {
	const response = await fetch(
		`${LEVELUP_API_URL}/api/daily-goals/tasks/complete`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		}
	);

	const result = await response.json();

	if (!response.ok) {
		throw new Error(
			result.detail || "Could not complete daily goal task"
		);
	}

	return result;
}


// create daily goal.
export async function createDailyGoal(dailyGoalData) {
	const response = await fetch(`${LEVELUP_API_URL}/api/daily-goals`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(dailyGoalData),
	});

	const result = await response.json();

	if (!response.ok) {
		throw new Error(result.detail || "Could not create daily goal");
	}

	return result;
}


// Progress daily goal task
export async function progressDailyGoalTask(data) {
	const response = await fetch(
		`${LEVELUP_API_URL}/api/daily-goals/tasks/progress`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		}
	);

	const result = await response.json();

	if (!response.ok) {
		throw new Error(result.detail || "Could not update daily goal progress");
	}

	return result;
}