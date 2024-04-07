/** @type {import('tailwindcss').Config} */
import { fontFamily } from "tailwindcss/defaultTheme";
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
          1: "#212236"
        },
        success: "#08fc81",
        failed: "#d97193"
      },
      fontFamily: {
        sans: ["var(--font-sora)", ...fontFamily.sans],
        code: "var(--font-code)",
        segoe: "var(--font-segoe)",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
    },
  },
  plugins: [
    plugin(({addComponents, addUtilities}) => {
      addComponents({
        '.btn': {
          "@apply select-none cursor-pointer transition-all": {}
        },
        '.btn-primary': {
          "@apply btn text-fg-3 bg-pr-4 py-3 w-full rounded-xl mt-12 font-code text-sm hover:scale-105 active:scale-95 transition-all": {}
        },
        '.chip-rect': {
          "@apply bg-pr-5 px-[10px] py-[2px] rounded-[5px]": {}
        },
        '.btn-rect': {
          "@apply btn bg-pr-4 text-fg-3 rounded-[5px] px-[7px] py-[4px]" : {}
        },
      });
      addUtilities({

      })
    })
  ],
}