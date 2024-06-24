/** @type {import('tailwindcss').Config} */
import plugin from "tailwindcss/plugin";

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        "background": "#191a33",
        "primary": "#21223d",
        "accent": "#26254b",
        "secondary": "#6d67fd",
        "chip": "#6858b9",
        "tertiary": "#3a3881",
        "foreground": "#beb2b2",
        "foreground-muted": "#41486f",
        "foreground-accent": "#f8f6f6",
        "border": "#1e2039",
        "success": "#08fc81",
        "danger": "#f04343",
        "close": "#de6d92"
      },
      borderRadius: {
        '2xm': '5px',
        'xm': '3px'
      },
      fontSize: {
        '2xs': '13px',
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
      keyframes: {
        shake: {
          '0%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '50%': { transform: 'translateX(5px)' },
          '75%': { transform: 'translateX(-5px)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'shaking': 'shake 500ms',
      },
      fontFamily: {
        code: "var(--font-code)"
      }
  },
  },
  plugins: [
    plugin(({addComponents, addUtilities}) => {
      addComponents({
        '.btn': {
          "@apply select-none cursor-pointer": {}
        },
        '.btn-hover': {
          "@apply btn text-foreground hover:text-foreground-accent transition-colors": {}
        },
        '.chip': {
          "@apply bg-chip px-[9px] py-[2px] rounded-2xm": {}
        },
        '.btn-rect': {
          "@apply btn bg-secondary text-foreground-accent rounded-2xm px-[7px] py-[4px]" : {}
        }
      });
      addUtilities({
        '.flex-y-center': {
          "@apply flex items-center": {}
        },
        '.flex-x-center': {
          "@apply flex justify-center": {}
        },
        '.flex-center': {
          "@apply flex items-center justify-center": {}
        },
        '.grad-purple': {
          "@apply bg-gradient-to-br from-[#721fde] to-[#695ad3]": {}
        },
        '.grad-chip': {
          "@apply  bg-gradient-to-br from-[#26254b]  from-10% to-[#2b2b4f]": {}
        },
        '.grad-primary': {
          "@apply bg-gradient-to-r from-[#87CEFA] to-[#6c5ecf]": {}
        },
        '.invalidate': {
          "@apply pointer-events-none bg-danger animate-shaking": {}
        },
        '.backdrop-primary': {
          "@apply bg-primary/80 backdrop-saturate-150 backdrop-blur-md": {}
        },
        '.translate-center': {
          "@apply -translate-y-1/2 -translate-x-1/2 left-1/2 top-1/2": {}
        },
        '.letter-space': {
            letterSpacing: "1px"
        }
      })
    })
  ],
}