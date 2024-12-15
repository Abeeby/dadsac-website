// Internationalisation
const i18n = {
    currentLang: 'fr',
    translations: {
        fr: {
            welcome: "Bienvenue sur DADSAC",
            donate: "Faire un don",
            // ... autres traductions
        },
        en: {
            welcome: "Welcome to DADSAC",
            donate: "Donate",
            // ... autres traductions
        },
        sw: {
            welcome: "Karibu DADSAC",
            donate: "Changia",
            // ... autres traductions
        }
    },

    translate(key) {
        return this.translations[this.currentLang][key] || key;
    },

    changeLanguage(lang) {
        this.currentLang = lang;
        this.updateUI();
    }
}; 