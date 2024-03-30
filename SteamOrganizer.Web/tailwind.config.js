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
                6: "#3F3D7C",
                7: "linear-gradient(to right, #87CEFA 0%, #6c5ecf 100%)"
            },
            fg: {
                1: "#474c69",
                2: "#b8b8b8",
                3: "#f7f7f7"
            },
            stroke: {
                1: "#212236"
            }
        },
        fontFamily: {
            sans: ["var(--font-sora)", ...fontFamily.sans],
            code: "var(--font-code)",
            grotesk: "var(--font-grotesk)",
        },
        transitionDuration: {
            DEFAULT: "200ms",
        },
    },
  },
  plugins: [
      plugin(({addComponents, addUtilities}) => {
          addComponents({
              '.btn-primary': {
                  "@apply text-fg-3 bg-pr-4 py-3 w-full rounded-xl mt-12 font-code text-sm hover:scale-105 active:scale-95 transition-all": {}
              }
          });
          addUtilities({

          })
      })
  ],
}

