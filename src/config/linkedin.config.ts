// src/config/linkedin.config.ts
export const LinkedInConfig = {
  // Configurações para VPS
  puppeteer: {
    headless: process.env.NODE_ENV === 'production',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
    ],
  },
  
  // Limites de segurança
  limits: {
    maxApplicationsPerDay: 50,
    delayBetweenActions: {
      min: 2000,
      max: 5000
    },
    maxConcurrentSessions: 3
  },
  
  // Diretórios
  directories: {
    sessions: process.cwd() + '/linkedin-sessions',
    logs: process.cwd() + '/logs/linkedin'
  }
};