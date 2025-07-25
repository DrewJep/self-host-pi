module.exports = {
  content: [
    './src/**/*.{astro,html,js,jsx,ts,tsx,vue,svelte}',
  ],
  theme: {
    extend: {
      colors: {
        'soft-blue': '#e3f0ff',
        'primary-blue': '#3b82f6',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}; 