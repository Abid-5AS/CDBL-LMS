
import { PrismaClient } from './src/generated/prisma/client';
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error("DATABASE_URL not found");
    process.exit(1);
}

const url = new URL(dbUrl);
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  allowPublicKeyRetrieval: true,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "employee1@test.local";
  const password = "password123";

  console.log(`Checking user: ${email}`);

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log("❌ User NOT FOUND in database.");
      const employees = await prisma.user.findMany({
        where: { email: { contains: 'demo.local' } },
        take: 5,
        select: { email: true, role: true }
      });
      console.log("Demo users found in DB:", employees);
    } else {
      console.log("✅ User FOUND.");
      console.log(`Role: ${user.role}`);
      console.log(`Stored Password Hash: ${user.password ? user.password.substring(0, 10) + "..." : "NULL"}`);
      
      if (!user.password) {
        console.log("❌ Password is NULL on user record.");
      } else {
        const isValid = await bcrypt.compare(password, user.password);
        if (isValid) {
          console.log("✅ Password 'password123' MATCHES the stored hash.");
        } else {
          console.log("❌ Password 'password123' DOES NOT MATCH the stored hash.");
          
          // Test if it's a plain text password (sometimes happens in dev)
          if (user.password === password) {
             console.log("⚠️  Detailed check: Stored password is PLAIN TEXT, not hashed.");
          }
        }
      }
    }
  } catch (err) {
    console.error("Error querying database:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
