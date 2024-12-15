// Service API
const api = {
    baseURL: 'https://api.dadsac.ch',

    async get(endpoint) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    },

    async post(endpoint, data) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        return this.handleResponse(response);
    },

    getHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    }
}; 