/* =========================================================
   API HELPER — FRONTEND CLIENT
   Reusable HTTP client for authenticated backend communication.
   ========================================================= */

const API_BASE_URL = (typeof window !== 'undefined' && window.location.origin && window.location.origin.includes(':5000'))
    ? ''
    : 'http://localhost:5000';

const api = {
    baseUrl: API_BASE_URL,

    // Token & User Persistence
    getToken() {
        return localStorage.getItem('token');
    },

    setToken(token) {
        if (token) {
            localStorage.setItem('token', token);
        }
    },

    removeToken() {
        localStorage.removeItem('token');
    },

    getUser() {
        try {
            const raw = localStorage.getItem('user');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    },

    setUser(user) {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        }
    },

    removeUser() {
        localStorage.removeItem('user');
    },

    // Session Termination
    logout() {
        api.removeToken();
        api.removeUser();
        window.location.href = 'login.html';
    },

    // Core Request Dispatcher
    async request(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        const token = api.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                data = { success: response.ok, message: text };
            }

            // Handle unauthorized access (expired / invalid token)
            if (response.status === 401) {
                const currentPath = window.location.pathname.toLowerCase();
                const isLoginPage = currentPath.endsWith('login.html') || currentPath.endsWith('/');
                if (!isLoginPage) {
                    api.removeToken();
                    api.removeUser();
                    window.location.href = 'login.html';
                }
                const err = new Error(data.message || 'Unauthorized');
                err.status = 401;
                err.data = data;
                throw err;
            }

            if (!response.ok) {
                const err = new Error(data.message || `Request failed with status ${response.status}`);
                err.status = response.status;
                err.data = data;
                throw err;
            }

            return data;
        } catch (error) {
            // Rethrow so callers can handle or show toast/error notifications
            throw error;
        }
    },

    get(endpoint, headers = {}) {
        return api.request(endpoint, { method: 'GET', headers });
    },

    post(endpoint, body = {}, headers = {}) {
        return api.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
            headers
        });
    },

    put(endpoint, body = {}, headers = {}) {
        return api.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body),
            headers
        });
    },

    delete(endpoint, headers = {}) {
        return api.request(endpoint, { method: 'DELETE', headers });
    },

    // Authenticated Page Guard: verifies token against GET /api/auth/me
    async checkAuth() {
        const token = api.getToken();
        if (!token) {
            window.location.href = 'login.html';
            return null;
        }

        try {
            const res = await api.get('/api/auth/me');
            const user = res.data;
            if (user) {
                api.setUser(user);
                // Update topbar user name if present
                const nameEl = document.querySelector('.a-name');
                if (nameEl && user.name) {
                    nameEl.textContent = user.name;
                }
                // Update topbar avatar if present
                const avatarEl = document.querySelector('.admin-avatar');
                if (avatarEl && user.name) {
                    const initials = user.name
                        .split(' ')
                        .map(n => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase();
                    avatarEl.textContent = initials || 'AD';
                }
            }
            return user;
        } catch (error) {
            // Token rejected by backend (401 or invalid)
            api.removeToken();
            api.removeUser();
            window.location.href = 'login.html';
            return null;
        }
    }
};
