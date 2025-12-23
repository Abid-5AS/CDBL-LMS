import { PrismaClient } from "@/src/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

// Parse the DATABASE_URL to extract connection details
const dbUrl = process.env.DATABASE_URL!;
const url = new URL(dbUrl);

// PrismaMariaDb adapter expects a configuration object
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1), // Remove leading slash
  // Optimization for 8GB RAM Machine:
  // Limit connection pool to prevent "Too many connections" during hot reloads
  connectionLimit: process.env.NODE_ENV === "production" ? 10 : 5,
  idleTimeout: 60, // Close idle connections after 60s
});

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
