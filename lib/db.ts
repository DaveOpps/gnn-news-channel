import "dotenv/config";
import type { PrismaClient } from "./generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Constructed lazily, on first actual use — not at module import time. Next.js
// evaluates this module while collecting page data for every route (even
// force-dynamic ones), and an eager `new PrismaClient()`/adapter connection
// there would mean a build-time network attempt this app has no business
// making.
function createClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require("./generated/prisma/client");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaNeon } = require("@prisma/adapter-neon");
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const client: PrismaClient = new PrismaClient({ adapter });
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
}

let client: PrismaClient | undefined;

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    if (!client) client = createClient();
    return Reflect.get(client as object, prop, receiver);
  },
});
