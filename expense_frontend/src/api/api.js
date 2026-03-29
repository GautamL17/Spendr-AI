import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// ─── attach access token to every request ────────────────────────────────────
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("access"); // ← was "token", matches Login.jsx
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// ─── refresh token interceptor ───────────────────────────────────────────────
// if a request 401s → try refreshing the access token silently → retry once
API.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    // only retry on 401, only once, and not for the refresh call itself
    if (
      err.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes("token/refresh")
    ) {
      original._retry = true;

      try {
        const refresh = localStorage.getItem("refresh");
        if (!refresh) throw new Error("no refresh token");

        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}users/token/refresh/`,
          { refresh }
        );

        const newAccess = res.data.access;
        localStorage.setItem("access", newAccess);

        // retry original request with new token
        original.headers.Authorization = `Bearer ${newAccess}`;
        return API(original);
      } catch {
        // refresh failed → clear tokens and send to login
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        window.location.href = "/login";
      }
    }

    return Promise.reject(err);
  }
);

export default API;