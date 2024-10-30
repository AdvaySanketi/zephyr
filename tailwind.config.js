/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./node_modules/flowbite-react/**/*.js",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
 
    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors:{
        'zinc-750' : '#303036',
        'background' : '#1f1f20'
      },
      fontFamily:{
        'noto':['Noto Sans', 'sans-serif']  
      }
    },
  },
  plugins: [
    require("flowbite/plugin")
  ],
}

