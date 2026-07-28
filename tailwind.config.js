/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          "base-100": "#ffffff",
          "base-200": "#f7f6f2",
          "base-300": "#dfe5ec",
          "base-content": "#111827",
          primary: "#1d5fd7",
          "primary-content": "#ffffff",
          secondary: "#16845b",
          "secondary-content": "#ffffff",
          accent: "#d97706",
          "accent-content": "#ffffff",
          neutral: "#1f2937",
          "neutral-content": "#ffffff",
          info: "#1d5fd7",
          success: "#16845b",
          warning: "#d97706",
          error: "#d12d2d",
        },
      },
      {
        dark: {
          "base-100": "#111821",
          "base-200": "#151e2b",
          "base-300": "#263345",
          "base-content": "#e7edf7",
          primary: "#79a8ff",
          "primary-content": "#07111f",
          secondary: "#49c996",
          "secondary-content": "#061610",
          accent: "#f2b94b",
          "accent-content": "#1f1504",
          neutral: "#0b1018",
          "neutral-content": "#e7edf7",
          info: "#79a8ff",
          success: "#49c996",
          warning: "#f2b94b",
          error: "#ff7474",
        },
      },
    ],
  },
} 