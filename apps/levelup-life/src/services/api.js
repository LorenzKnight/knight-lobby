const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8002";

export async function getDatabaseTest() {
    const response = await fetch(`${API_URL}/api/test/connection`);

    if (!response.ok) {
        throw new Error("Error loading database data");
    }

    return await response.json();
}