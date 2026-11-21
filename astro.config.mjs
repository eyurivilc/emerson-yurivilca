import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { deploymentConfig } from "./src/deployment.mjs";

export default defineConfig({
  ...deploymentConfig(process.env),
  output: "static",
  vite: { plugins: [tailwindcss()] },
});
