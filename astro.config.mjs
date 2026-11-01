import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://eyurivilc.github.io',
  base: '/emerson-yurivilca',
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
});