import type { Config } from "tailwindcss";
const { nextui } = require("@nextui-org/theme");

const defaultTheme = require("tailwindcss/defaultTheme");

const config: Config = {
  darkMode: ["selector"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      fontFamily: {
        SiYuanSongTi: ["SiYuanSongTi", ...defaultTheme.fontFamily.sans],
        FangZhengKaiTi: ["FangZhengKaiTi", ...defaultTheme.fontFamily.sans],
        SiYuanHeiTi: ["SiYuanHeiTi", ...defaultTheme.fontFamily.sans],
        XiaLuZhenKai: ["XiaLuZhenKai", ...defaultTheme.fontFamily.sans],
        HanZiPinYin: ["HanZiPinYin", ...defaultTheme.fontFamily.sans],
        JiangChengYuanTi: ["JiangChengYuanTi", ...defaultTheme.fontFamily.sans],
        LinHaiLiShu: ["LinHaiLiShu", ...defaultTheme.fontFamily.sans],
        Comfortaa: ["Comfortaa", ...defaultTheme.fontFamily.sans],
        FrederickatheGreat: ["FrederickatheGreat", ...defaultTheme.fontFamily.sans],
        RobotoSlab: ["RobotoSlab", ...defaultTheme.fontFamily.sans],
        Merienda: ["Merienda", ...defaultTheme.fontFamily.sans],
        ComicNeueAngular: ["ComicNeueAngular", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [require("tailwindcss-animate"), nextui()],
};
export default config;
