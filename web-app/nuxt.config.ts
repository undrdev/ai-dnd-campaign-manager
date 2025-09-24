// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Enable devtools in development
  devtools: { enabled: true },
  
  // TypeScript configuration
  typescript: {
    strict: true,
    typeCheck: true
  },
  
  // CSS frameworks and global styles
  css: [
    'vuetify/lib/styles/main.sass',
    '@mdi/font/css/materialdesignicons.css',
    '~/assets/css/main.css'
  ],
  
  // Nuxt modules
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt'
  ],
  
  // Build configuration
  build: {
    transpile: ['vuetify']
  },
  
  // Vite configuration
  vite: {
    define: {
      'process.env.DEBUG': false,
    },
    ssr: {
      noExternal: ['vuetify']
    }
  },
  
  // Runtime configuration
  runtimeConfig: {
    // Private keys (only available on server-side)
    jwtSecret: process.env.NUXT_SECRET_JWT_SECRET || 'default-dev-secret',
    
    // Public keys (exposed to client-side)
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:5000',
      appName: process.env.NUXT_PUBLIC_APP_NAME || 'D&D AI Campaign Manager'
    }
  },
  
  // App configuration
  app: {
    head: {
      title: 'D&D AI Campaign Manager',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'AI-powered D&D campaign management platform' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },
  
  // Server-side rendering configuration
  ssr: true,
  
  // Experimental features
  experimental: {
    payloadExtraction: false
  }
})
