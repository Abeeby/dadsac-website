// Gestion de l'authentification
const auth = {
    user: null,

    async login(credentials) {
        try {
            const response = await api.post('/auth/login', credentials);
            if (response.token) {
                this.setUser(response.user);
                localStorage.setItem('token', response.token);
                return true;
            }
        } catch (error) {
            console.error('Erreur de connexion:', error);
            return false;
        }
    },

    setUser(userData) {
        this.user = userData;
        this.updateUI();
    },

    updateUI() {
        const memberArea = document.querySelector('.member-area');
        if (this.user) {
            memberArea.innerHTML = `
                <div class="user-profile">
                    <img src="${this.user.avatar}" alt="Profile">
                    <span>Bienvenue, ${this.user.name}</span>
                </div>
            `;
        }
    }
}; 