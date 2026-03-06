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
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('export async function GET') && !content.includes('export const dynamic')) {
                fs.appendFileSync(fullPath, '\nexport const dynamic = "force-dynamic";\n');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

// Ensure the paths are relative to the root where the script runs
const rootDir = process.cwd();
processDir(path.join(rootDir, 'app/api'));
console.log('Done.');
