module.exports = {
  content: ["./app/**/*.{ts,tsx,jsx,js}"],
  theme: {
    fontFamily: {
      'default': "var(--customfont)"
    },
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
}
