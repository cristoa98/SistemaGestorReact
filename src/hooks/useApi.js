import { useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";

export function useApi() {
    const { token } = useAuth();

    const api = useCallback(
        (path, options = {}) => apiRequest(path, { token, ...options }),
        [token]
    );

    return { api, token };
}
