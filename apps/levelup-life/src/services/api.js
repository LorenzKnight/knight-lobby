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