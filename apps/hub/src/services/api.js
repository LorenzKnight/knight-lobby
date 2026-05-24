const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

export async function getEcosystemApps() {
    const response = await fetch(`${API_URL}/api/ecosystem/apps`);

    if (!response.ok) {
        throw new Error("Error loading ecosystem apps");
    }

    return await response.json();
}