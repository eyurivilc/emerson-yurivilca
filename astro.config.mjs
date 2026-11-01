import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({site:'https://emerson-yurivilca-tech.ericaldi77.chatgpt.site', output:'static', vite:{plugins:[tailwindcss()]}});
