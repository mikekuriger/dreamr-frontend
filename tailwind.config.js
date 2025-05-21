/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        carousel: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
      animation: {
        carousel: 'carousel 30s linear infinite',
      },
    },
  },
  plugins: [],
};


/** @type {import('tailwindcss').Config} */
// export default {
//   content: [
//     "./index.html",
//     "./src/**/*.{js,ts,jsx,tsx}",
//   ],
//   theme: {
//     extend: {
//       keyframes: {
//         scroll: {
//           '0%': { transform: 'translateX(0%)' },
//           '100%': { transform: 'translateX(-50%)' },
//         },
//       },
//       animation: {
//         scroll: 'scroll 30s linear infinite',
//       },
//     },
//   },
//   plugins: [],
// };

