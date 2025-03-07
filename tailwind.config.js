/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        portion: {
          "primary": "#0FA3B1",
          "secondary": "#B5E2FA",
          "accent": "#EDDEA4",
          "neutral": "#F9F7F3",
          "base-100": "#F9F7F3",
          "info": "#B5E2FA",
          "success": "#0FA3B1",
          "warning": "#EDDEA4",
          "error": "#F7A072",
        },
      },
    ],
  },
}

/*
#0FA3B1 (Teal) - Primary color - Good for main actions and branding
#B5E2FA (Light Blue) - Secondary color - For less prominent elements
#F9F7F3 (Off White) - Base/Background color - Perfect for the main background
#EDDEA4 (Light Yellow) - Accent color - For highlights and special elements
#F7A072 (Coral) - Error/Warning color - For destructive actions or alerts
*/