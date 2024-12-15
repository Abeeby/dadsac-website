class Carousel {
    constructor(element) {
        this.element = element;
        this.items = element.querySelectorAll('.carousel-item');
        this.currentIndex = 0;
        this.init();
    }

    init() {
        this.createControls();
        this.startAutoPlay();
    }

    createControls() {
        const prev = document.createElement('button');
        const next = document.createElement('button');
        prev.innerHTML = '←';
        next.innerHTML = '→';
        prev.classList.add('carousel-control', 'prev');
        next.classList.add('carousel-control', 'next');
        
        prev.addEventListener('click', () => this.prev());
        next.addEventListener('click', () => this.next());
        
        this.element.appendChild(prev);
        this.element.appendChild(next);
    }

    next() {
        this.currentIndex = (this.currentIndex + 1) % this.items.length;
        this.updateSlide();
    }

    prev() {
        this.currentIndex = (this.currentIndex - 1 + this.items.length) % this.items.length;
        this.updateSlide();
    }

    updateSlide() {
        const offset = -this.currentIndex * 100;
        this.element.querySelector('.carousel-track').style.transform = `translateX(${offset}%)`;
    }

    startAutoPlay() {
        setInterval(() => this.next(), 5000);
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    const carousels = document.querySelectorAll('.carousel');
    carousels.forEach(carousel => new Carousel(carousel));
});
