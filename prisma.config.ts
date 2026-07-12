import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // Migrations need a direct (non-pooled) connection — Neon's pgbouncer
  // pooling endpoint can't run schema-changing statements.
  datasource: { url: env("DIRECT_URL") },
});
