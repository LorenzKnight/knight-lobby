const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL;

export async function loginUser(email, password) {
  const response = await fetch(`${AUTH_API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || data.message || "Login failed");
  }

  return data;
}

export async function getMe(token) {
  const response = await fetch(`${AUTH_API_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || data.message || "Could not load user");
  }

  return data;
}

export async function getMyApps(token) {
  const response = await fetch(`${AUTH_API_URL}/api/auth/me/apps`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || data.message || "Could not load apps");
  }

  return data;
}