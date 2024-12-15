// Système de routing
const router = {
    routes: {
        '/': 'pages/home.html',
        '/programmes': 'pages/programmes.html',
        '/impact': 'pages/impact.html',
        '/equipe': 'pages/equipe.html',
        '/don': 'pages/donation.html',
        '/contact': 'pages/contact.html'
    },

    async navigate(path) {
        const content = await this.loadPage(this.routes[path]);
        document.querySelector('main').innerHTML = content;
        this.updateActiveNav(path);
    },

    async loadPage(url) {
        try {
            const response = await fetch(url);
            return await response.text();
        } catch (error) {
            console.error('Erreur de chargement:', error);
            return '<h1>Page non trouvée</h1>';
        }
    }
}; 