import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { md3 } from 'vuetify/blueprints'

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    blueprint: md3,
    components,
    directives,
    icons: {
      defaultSet: 'mdi',
      aliases,
      sets: {
        mdi,
      },
    },
    theme: {
      defaultTheme: 'dndTheme',
      themes: {
        dndTheme: {
          dark: false,
          colors: {
            // Primary D&D colors
            primary: '#8B0000',        // Dark Red
            'primary-darken-1': '#660000',
            'primary-lighten-1': '#CD5C5C',
            
            // Secondary colors
            secondary: '#DAA520',      // Goldenrod
            'secondary-darken-1': '#B8860B',
            'secondary-lighten-1': '#FFD700',
            
            // Accent colors
            accent: '#FF6B35',         // Orange Red
            
            // System colors
            error: '#F44336',
            warning: '#FF9800',
            info: '#2196F3',
            success: '#4CAF50',
            
            // Surface colors
            surface: '#FFFFFF',
            'surface-variant': '#F5F5F5',
            'on-surface': '#212121',
            'on-surface-variant': '#616161',
            
            // Background colors
            background: '#FAFAFA',
            'on-background': '#212121',
            
            // Additional D&D themed colors
            parchment: '#F4E4BC',
            leather: '#8B4513',
            gold: '#FFD700',
            silver: '#C0C0C0',
            bronze: '#CD7F32'
          }
        },
        dndDarkTheme: {
          dark: true,
          colors: {
            // Primary D&D colors (adjusted for dark theme)
            primary: '#CD5C5C',        // Lighter red for dark theme
            'primary-darken-1': '#8B0000',
            'primary-lighten-1': '#F08080',
            
            // Secondary colors
            secondary: '#FFD700',      // Gold (brighter for dark theme)
            'secondary-darken-1': '#DAA520',
            'secondary-lighten-1': '#FFFF99',
            
            // Accent colors
            accent: '#FF8A65',
            
            // System colors
            error: '#EF5350',
            warning: '#FFA726',
            info: '#42A5F5',
            success: '#66BB6A',
            
            // Surface colors
            surface: '#1E1E1E',
            'surface-variant': '#2D2D2D',
            'on-surface': '#FFFFFF',
            'on-surface-variant': '#B3B3B3',
            
            // Background colors
            background: '#121212',
            'on-background': '#FFFFFF',
            
            // Additional D&D themed colors (dark variants)
            parchment: '#3A3528',
            leather: '#5D2F0A',
            gold: '#B8860B',
            silver: '#808080',
            bronze: '#8B6914'
          }
        }
      },
    },
    defaults: {
      VBtn: {
        style: 'text-transform: none; font-weight: 500;',
        elevation: 2,
      },
      VCard: {
        elevation: 3,
      },
      VTextField: {
        variant: 'outlined',
        density: 'comfortable',
      },
      VTextarea: {
        variant: 'outlined',
        density: 'comfortable',
      },
      VSelect: {
        variant: 'outlined',
        density: 'comfortable',
      },
      VAutocomplete: {
        variant: 'outlined',
        density: 'comfortable',
      },
      VCombobox: {
        variant: 'outlined',
        density: 'comfortable',
      },
      VFileInput: {
        variant: 'outlined',
        density: 'comfortable',
      },
      VSwitch: {
        color: 'primary',
      },
      VCheckbox: {
        color: 'primary',
      },
      VRadio: {
        color: 'primary',
      },
      VSlider: {
        color: 'primary',
      },
      VProgressLinear: {
        color: 'primary',
      },
      VProgressCircular: {
        color: 'primary',
      },
    },
  })

  nuxtApp.vueApp.use(vuetify)
})
