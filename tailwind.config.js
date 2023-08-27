module.exports = {
  content: ["./app/**/*.{ts,tsx,jsx,js}"],
  theme: {
    fontFamily: {
      'default': "var(--customfont)"
    },
    extend: {
      animation: {
        "start-loading": "startLoading 2s ease-in-out forwards",
        "end-loading": "endLoading 0.2s ease-in-out forwards",
        "pulsing": "pulseSlow 6s infinite ease-in-out",
        overlayShow: 'overlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        contentShow: 'contentShow 500ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        startLoading: {
          "0%": { width: "0" },
          "100%": { width: "50%" },
        },
        endLoading: {
          "0%": { width: "50%" },
          "100%": { width: "100%" },
        },
        pulseSlow: {
          "0%": { transform: "scale(1)", opacity: "0.7" },
          "50%": { transform: "scale(1.5)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "0.7" }
        },
        overlayShow: {
          from: { opacity: 0 },
          to: { opacity: 0.5 },
        },
        contentShow: {
          from: { opacity: 0, transform: 'translateY(20%) scale(0.96)' },
          to: { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
}
