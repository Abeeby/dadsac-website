// Configuration principale de l'application
const app = {
    init() {
        this.loadModules();
        this.setupEventListeners();
        this.initializeAuth();
    },

    loadModules() {
        // Chargement dynamique des modules
        import('../modules/donation.js');
        import('./modules/newsletter.js');
        import('../modules/auth.js');
        import('./modules/gallery.js');
    },

    setupEventListeners() {
        // Gestion de la navigation
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', this.handleNavigation);
        });

        // Gestion du changement de langue
        document.querySelectorAll('.language-switcher button').forEach(btn => {
            btn.addEventListener('click', this.handleLanguageChange);
        });
    },

    handleNavigation(e) {
        e.preventDefault();
        const path = e.target.getAttribute('href');
        router.navigate(path);
    },

    handleLanguageChange(e) {
        const lang = e.target.dataset.lang;
        i18n.changeLanguage(lang);
    }
}; 