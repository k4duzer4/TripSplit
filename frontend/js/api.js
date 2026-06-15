const PROD_API_URL = 'https://tripsplit-m51c.onrender.com/api';
const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && !PROD_API_URL 
    ? 'http://localhost:3000/api' 
    : PROD_API_URL;

const api = {
    getToken() {
        return localStorage.getItem('token');
    },
    
    setToken(token) {
        localStorage.setItem('token', token);
    },

    clearToken() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    },

    getUser() {
        const u = localStorage.getItem('user');
        return u ? JSON.parse(u) : null;
    },

    async request(endpoint, method = 'GET', body = null) {
        const headers = {
            'Content-Type': 'application/json'
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method,
            headers
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`${API_URL}${endpoint}`, config);
            const data = await response.json();
            
            if (!response.ok) {
                if (response.status === 401) {
                    this.clearToken();
                    window.location.hash = '#login';
                }
                throw new Error(data.error || 'Erro na requisição');
            }

            return data;
        } catch (error) {
            throw error;
        }
    },

    login: (email, password) => api.request('/auth/login', 'POST', { email, password }),
    register: (name, email, password) => api.request('/auth/register', 'POST', { name, email, password }),

    getTrips: () => api.request('/trips'),
    createTrip: (title) => api.request('/trips', 'POST', { title }),
    getTrip: (id) => api.request(`/trips/${id}`),
    addParticipant: (tripId, email) => api.request(`/trips/${tripId}/participants`, 'POST', { email }),
    finishTrip: (tripId) => api.request(`/trips/${tripId}/finish`, 'POST'),

    getExpenses: (tripId) => api.request(`/expenses/trip/${tripId}`),
    addExpense: (tripId, data) => api.request(`/expenses/trip/${tripId}`, 'POST', data),
    deleteExpense: (id) => api.request(`/expenses/${id}`, 'DELETE'),

    getSettlement: (tripId) => api.request(`/settlement/${tripId}`)
};
