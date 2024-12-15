class ParallaxEffect {
    constructor() {
        this.parallaxElements = document.querySelectorAll('.parallax');
        this.init();
    }

    init() {
        window.addEventListener('scroll', () => this.updateParallax());
    }

    updateParallax() {
        this.parallaxElements.forEach(element => {
            const speed = element.dataset.speed || 0.5;
            const offset = window.pageYOffset * speed;
            element.style.transform = `translateY(${offset}px)`;
        });
    }
}

// Initialisation
new ParallaxEffect();
