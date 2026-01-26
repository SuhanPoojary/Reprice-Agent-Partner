import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

function normalizeBase(input: string | undefined) {
  const raw = String(input || "").trim();
  if (!raw) return "/__admin_portal_93c2f7/";
  const withSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withSlash.endsWith("/") ? withSlash : `${withSlash}/`;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = normalizeBase(env.VITE_ADMIN_BASENAME);

  return {
    base,
    plugins: [
      react(),
      tailwindcss(), // <- this enables Tailwind in Vite
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
