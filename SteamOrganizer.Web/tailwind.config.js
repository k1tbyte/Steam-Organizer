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
        pr: {
          1: "#1b1c31",
          2: "#24253a",
          3: "#292848",
          4: "#6d67fd",
          5: "#6c5eb3",
          6: "#3F3D7C"
        },
        fg: {
          1: "#474c69",
          2: "#b8b8b8",
          3: "#f7f7f7"
        },
        stroke: {
          1: "#212236",
          2: "#7222db",
          3: "#6c5ecf"
        },
        success: "#08fc81",
        failed: "var(--failed)",
        close: "#ee6f60"
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
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-out': {
          '100%': { opacity: '0' },
        },
        'pop-in': {
          from: { opacity: '0', marginTop: '-100px' },
          to: { opacity: '1', margin: '0px' },
        },
        'pop-out': {
          '100%': { opacity: '0', marginTop: '-50px' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms',
        'fade-out': 'fade-out 150ms',
      },
  },
  },
  plugins: [
    plugin(({addComponents, addUtilities}) => {
      addComponents({
        '.btn': {
          "@apply select-none cursor-pointer": {}
        },
        '.chip': {
          "@apply bg-pr-5 px-[9.7px] py-[2px] rounded-2xm": {}
        },
        '.btn-rect': {
          "@apply btn bg-pr-4 text-fg-3 rounded-2xm px-[7px] py-[4px]" : {}
        }
      });
      addUtilities({
        '.flex-center': {
          "@apply flex items-center justify-center": {}
        }
      })
    })
  ],
}