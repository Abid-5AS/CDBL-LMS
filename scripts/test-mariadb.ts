import mariadb from "mariadb";
import dotenv from "dotenv";

dotenv.config();

async function testConnection() {
    const dbUrl = process.env.DATABASE_URL!;
    console.log("DATABASE_URL:", dbUrl);

    const url = new URL(dbUrl);
    console.log("Parsed URL:");
    console.log("  Host:", url.hostname);
    console.log("  Port:", url.port || "3306");
    console.log("  User:", url.username);
    console.log("  Password:", url.password ? "***" : "none");
    console.log("  Database:", url.pathname.slice(1));

    const pool = mariadb.createPool({
        host: url.hostname,
        port: parseInt(url.port) || 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1),
        connectionLimit: 10,
        acquireTimeout: 10000,
    });

    try {
        console.log("\nTesting connection...");
        const conn = await pool.getConnection();
        console.log("✓ Connection successful!");

        const rows = await conn.query("SELECT 1 as val");
        console.log("✓ Query successful:", rows);

        conn.release();
        await pool.end();
        console.log("✓ Pool closed");
    } catch (error) {
        console.error("✗ Connection failed:", error);
        process.exit(1);
    }
}

testConnection();
