import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["light"],
          "base-100": "#eff1f5",
          "base-200": "#e6e9ef",
          "base-300": "#dce0e8",
          "base-content": "#4c4f69",
          "neutral": "#ccd0da",
          "neutral-content": "#4c4f69",
          "primary": "#d20f39",
        },
        dark: {
          ...require("daisyui/src/theming/themes")["dark"],
          "base-100": "#303446",
          "base-200": "#292c3c",
          "base-300": "#232634",
          "base-content": "#c6d0f5",
          "neutral": "#414559",
          "neutral-content": "#c6d0f5",
          "primary": "#e78284",
        },
      },
    ],
  },
  plugins: [require("@tailwindcss/typography"), require("daisyui")],
}
export default config
