// js/common.js
async function loadCommonElements() {
    try {
        // Charger le header
        const headerResponse = await fetch('/header.html');
        const headerContent = await headerResponse.text();
        document.body.insertAdjacentHTML('afterbegin', headerContent);

        // Charger le footer
        const footerResponse = await fetch('/footer.html');
        const footerContent = await footerResponse.text();
        document.body.insertAdjacentHTML('beforeend', footerContent);
    } catch (error) {
        console.error('Erreur lors du chargement des éléments communs:', error);
    }
}

// Charger les éléments au chargement de la page
document.addEventListener('DOMContentLoaded', loadCommonElements);