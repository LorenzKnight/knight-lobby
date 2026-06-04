const LEVELUP_API_URL = import.meta.env.VITE_LEVELUP_API_URL || import.meta.env.VITE_API_URL;

export async function testLevelupConnection() {
	const response = await fetch(`${LEVELUP_API_URL}/api/test/connection`);

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.detail || data.message || "LevelUp API error");
	}

	return data;
}