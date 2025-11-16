const RAW_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
export const API_BASE_URL = RAW_BASE.replace(/\/$/, "");

export async function apiRequest(
    path,
    { method = "GET", body, token, signal } = {}
) {
    const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

    const headers = {
        "Content-Type": "application/json",
    };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal,
    });

    const text = await response.text();
    let data;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    if (!response.ok) {
        const message = data?.error || data?.message || `Error ${response.status}`;
        const error = new Error(message);
        error.status = response.status;
        error.data = data;
        throw error;
    }

    return data;
}
