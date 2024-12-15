class Effects {
    constructor() {
        this.initParticles();
        this.init3DCards();
    }

    initParticles() {
        const particlesContainer = document.querySelector('.particles-bg');
        if (!particlesContainer) return;

        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            particlesContainer.appendChild(particle);
            this.animateParticle(particle);
        }
    }

    animateParticle(particle) {
        const animation = particle.animate([
            { transform: 'translate(0, 0)', opacity: 0 },
            { transform: `translate(${Math.random() * 100}vw, ${Math.random() * 100}vh)`, opacity: 0.5 },
            { transform: `translate(${Math.random() * 100}vw, ${Math.random() * 100}vh)`, opacity: 0 }
        ], {
            duration: Math.random() * 3000 + 2000,
            iterations: Infinity
        });
    }

    init3DCards() {
        const cards = document.querySelectorAll('.card-3d');
        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => this.handle3DEffect(e, card));
            card.addEventListener('mouseleave', () => this.reset3DEffect(card));
        });
    }

    handle3DEffect(e, card) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }

    reset3DEffect(card) {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
    }
}

// Initialisation
new Effects();
