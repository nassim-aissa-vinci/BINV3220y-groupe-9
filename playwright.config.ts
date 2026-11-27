import { randomBytes } from "node:crypto";
import { defineConfig, devices } from "@playwright/test";

// Les tests E2E tournent sur une pile dédiée, séparée de `npm run dev` :
// - API sur le port 3100, base backend/data/gesta-e2e.db recréée à partir du seed à chaque lancement ;
// - frontend Vite sur le port 5174, dont le proxy /api pointe vers cette API.
// Les données de démonstration sont donc maîtrisées et la base de développement n'est pas touchée.
const E2E_API_PORT = "3100";
const E2E_WEB_PORT = "5174";
const E2E_DATABASE_PATH = "data/gesta-e2e.db";

const backendEnv = {
  API_PORT: E2E_API_PORT,
  DATABASE_PATH: E2E_DATABASE_PATH,
  DEMO_AUTH_ENABLED: "true",
  // Secret jetable, propre à chaque exécution : aucun secret n'est versionné.
  JWT_SECRET: randomBytes(32).toString("hex"),
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${E2E_WEB_PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      // db:reset supprime puis recrée la base E2E avec le seed ; tsx sans watch ensuite.
      command: "npm run db:reset -w backend && npm exec -w backend -- tsx src/main.ts",
      url: `http://localhost:${E2E_API_PORT}/health`,
      env: backendEnv,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `npm run dev -w frontend -- --port ${E2E_WEB_PORT}`,
      url: `http://localhost:${E2E_WEB_PORT}`,
      env: { API_PORT: E2E_API_PORT },
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
