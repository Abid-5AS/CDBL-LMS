/**
 * Replaces direct `new PrismaClient()` instantiations in API routes
 * with the singleton import from `@/lib/prisma`.
 * This fixes Turbopack __internal crashes during `pnpm build`.
 */
const fs = require('fs');
const path = require('path');

function processDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            processDir(fullPath);
        } else if (entry.isFile() && entry.name === 'route.ts') {
            let content = fs.readFileSync(fullPath, 'utf8');

            if (!content.includes('new PrismaClient()')) continue;

            // Remove any existing PrismaClient import line
            content = content.replace(/^import\s*\{[^}]*PrismaClient[^}]*\}\s*from\s*["']@prisma\/client["'];?\s*\n?/gm, '');
            // Remove bare `import { PrismaClient } from "@/src/generated/prisma/client";` variants  
            content = content.replace(/^import\s*\{[^}]*PrismaClient[^}]*\}\s*from\s*["'][^"']+["'];?\s*\n?/gm, '');
            // Remove `const prisma = new PrismaClient();` line
            content = content.replace(/^const prisma\s*=\s*new PrismaClient\(\);?\s*\n?/gm, '');
            // Add singleton prisma import after the first import statement if not already there
            if (!content.includes("from \"@/lib/prisma\"") && !content.includes("from '@/lib/prisma'")) {
                // Insert after first import line
                content = content.replace(/(^import .+;\n)/, `$1import { prisma } from "@/lib/prisma";\n`);
            }
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`Fixed: ${fullPath}`);
        }
    }
}

processDir(path.join(process.cwd(), 'app/api'));

// Also fix lib/reports/executor.ts
const executorPath = path.join(process.cwd(), 'lib/reports/executor.ts');
if (fs.existsSync(executorPath)) {
    let content = fs.readFileSync(executorPath, 'utf8');
    if (content.includes('new PrismaClient()')) {
        content = content.replace(/^import\s*\{[^}]*PrismaClient[^}]*\}\s*from\s*["'][^"']+["'];?\s*\n?/gm, '');
        content = content.replace(/^const prisma\s*=\s*new PrismaClient\(\);?\s*\n?/gm, '');
        if (!content.includes("from \"@/lib/prisma\"") && !content.includes("from '@/lib/prisma'")) {
            content = content.replace(/(^import .+;\n)/, `$1import { prisma } from "@/lib/prisma";\n`);
        }
        fs.writeFileSync(executorPath, content, 'utf8');
        console.log(`Fixed: ${executorPath}`);
    }
}

console.log('Done.');
