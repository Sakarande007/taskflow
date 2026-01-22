export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors : {
                "primary200" : '#ff5722',
                "primary100" : '#ff8a50',
                "secondary200" : '#03a9f4',
                "secondary100" : '#67daff',
                "accent" : '#8bc34a',
            }
        },
    },
    plugins: [],
}