export const CONFIG = {
    API_URL: 'https://api.dadsac.org',
    ANIMATION_DURATION: 300,
    BREAKPOINTS: {
      mobile: 480,
      tablet: 768,
      desktop: 1024,
      wide: 1200
    },
    MAPS_API_KEY: 'your-api-key',
    CONTACT_EMAIL: 'contact@dadsac.org'
  };
  
  export const ANIMATIONS = {
    FADE_IN: {
      opacity: [0, 1],
      duration: 1000,
      easing: 'ease-in-out'
    },
    SLIDE_UP: {
      transform: ['translateY(20px)', 'translateY(0)'],
      opacity: [0, 1],
      duration: 800,
      easing: 'ease-out'
    }
  };
  
  export const VALIDATION_RULES = {
    email: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Veuillez entrer une adresse email valide'
    },
    phone: {
      pattern: /^(\+\d{1,3}[- ]?)?\d{10}$/,
      message: 'Veuillez entrer un numéro de téléphone valide'
    }
  };