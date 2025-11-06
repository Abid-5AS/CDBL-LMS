#!/usr/bin/env tsx

/**
 * Generate Codebase Structure Documentation
 * Creates a comprehensive markdown document showing the folder and file structure
 */

import { readdir, stat } from "fs/promises";
import { join, relative } from "path";
import { writeFile } from "fs/promises";

const IGNORE_PATTERNS = [
  "node_modules",
  ".git",
  ".next",
  ".turbo",
  "dist",
  "build",
  "coverage",
  ".cache",
  "*.log",
  ".DS_Store",
  "tsconfig.tsbuildinfo",
  ".env.local",
  ".env.*.local",
  "playwright-report",
  "test-results",
  "private/uploads",
  "reports",
  "mobile", // Exclude entire mobile app directory
];

const IGNORE_EXTENSIONS = [".map", ".tsbuildinfo", ".log"];

const MAX_DEPTH = 10;

interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  children?: FileNode[];
  extension?: string;
}

async function shouldIgnore(name: string, path: string): Promise<boolean> {
  // Check ignore patterns - check both name and full path
  for (const pattern of IGNORE_PATTERNS) {
    if (pattern.includes("*")) {
      const regex = new RegExp(pattern.replace(/\*/g, ".*"));
      if (regex.test(name) || regex.test(path)) return true;
    } else {
      // Check if pattern matches name or is in the path
      if (
        name === pattern ||
        path.includes(`/${pattern}/`) ||
        path.endsWith(`/${pattern}`)
      ) {
        return true;
      }
    }
  }

  // Check extensions
  const ext = name.substring(name.lastIndexOf("."));
  if (IGNORE_EXTENSIONS.includes(ext)) {
    return true;
  }

  return false;
}

async function buildTree(
  dirPath: string,
  basePath: string,
  depth: number = 0
): Promise<FileNode | null> {
  if (depth > MAX_DEPTH) return null;

  const name = dirPath.split("/").pop() || dirPath;

  if (await shouldIgnore(name, dirPath)) {
    return null;
  }

  try {
    const stats = await stat(dirPath);

    if (stats.isDirectory()) {
      const entries = await readdir(dirPath);
      const children: FileNode[] = [];

      for (const entry of entries) {
        const fullPath = join(dirPath, entry);
        const child = await buildTree(fullPath, basePath, depth + 1);
        if (child) {
          children.push(child);
        }
      }

      // Sort: directories first, then files, both alphabetically
      children.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "directory" ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      return {
        name,
        path: relative(basePath, dirPath),
        type: "directory",
        children: children.length > 0 ? children : undefined,
      };
    } else if (stats.isFile()) {
      const ext = name.substring(name.lastIndexOf("."));
      return {
        name,
        path: relative(basePath, dirPath),
        type: "file",
        size: stats.size,
        extension: ext || undefined,
      };
    }
  } catch (error) {
    // Skip files/directories we can't access
    return null;
  }

  return null;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function generateMarkdown(
  node: FileNode,
  indent: number = 0,
  isLast: boolean = true,
  prefix: string = ""
): string {
  const connector = isLast ? "└── " : "├── ";
  const currentPrefix = indent === 0 ? "" : prefix + connector;
  const nextPrefix = indent === 0 ? "" : prefix + (isLast ? "    " : "│   ");

  let line = `${currentPrefix}${node.name}`;

  if (node.type === "file") {
    const ext = node.extension || "";
    const size = node.size ? ` (${formatSize(node.size)})` : "";
    line += `${ext}${size}`;
  } else {
    line += "/";
    if (node.children && node.children.length > 0) {
      line += ` (${node.children.length} ${
        node.children.length === 1 ? "item" : "items"
      })`;
    }
  }

  const lines = [line];

  if (node.children && node.children.length > 0) {
    node.children.forEach((child, index) => {
      const isLastChild = index === node.children!.length - 1;
      lines.push(generateMarkdown(child, indent + 1, isLastChild, nextPrefix));
    });
  }

  return lines.join("\n");
}

function generateStats(node: FileNode): {
  files: number;
  directories: number;
  totalSize: number;
  byExtension: Record<string, { count: number; size: number }>;
} {
  const stats = {
    files: 0,
    directories: 0,
    totalSize: 0,
    byExtension: {} as Record<string, { count: number; size: number }>,
  };

  function traverse(n: FileNode) {
    if (n.type === "directory") {
      stats.directories++;
      if (n.children) {
        n.children.forEach(traverse);
      }
    } else {
      stats.files++;
      stats.totalSize += n.size || 0;
      const ext = n.extension || "(no extension)";
      if (!stats.byExtension[ext]) {
        stats.byExtension[ext] = { count: 0, size: 0 };
      }
      stats.byExtension[ext].count++;
      stats.byExtension[ext].size += n.size || 0;
    }
  }

  traverse(node);
  return stats;
}

async function main() {
  const projectRoot = process.cwd();
  const outputPath = join(projectRoot, "CODEBASE_STRUCTURE.md");

  console.log("📁 Generating codebase structure document...");
  console.log(`   Root: ${projectRoot}`);

  const root = await buildTree(projectRoot, projectRoot);

  if (!root) {
    console.error("❌ Failed to build directory tree");
    process.exit(1);
  }

  const stats = generateStats(root);
  const structure = generateMarkdown(root);

  const timestamp = new Date().toISOString();
  const markdown = `# CDBL Leave Management System - Codebase Structure

**Generated:** ${timestamp}  
**Project Root:** \`${projectRoot}\`

---

## 📊 Statistics

- **Total Files:** ${stats.files.toLocaleString()}
- **Total Directories:** ${stats.directories.toLocaleString()}
- **Total Size:** ${formatSize(stats.totalSize)}

### Files by Extension

${Object.entries(stats.byExtension)
  .sort((a, b) => b[1].count - a[1].count)
  .map(
    ([ext, data]) =>
      `- \`${ext}\`: ${data.count} files (${formatSize(data.size)})`
  )
  .join("\n")}

---

## 📂 Directory Structure

\`\`\`
${structure}
\`\`\`

---

## 🔍 Key Directories

### Application Code
- \`app/\` - Next.js App Router pages and API routes
- \`components/\` - React components
  - \`components/shared/\` - **NEW:** Shared reusable components
  - \`components/dashboard/\` - Dashboard-specific components
  - \`components/ui/\` - Base UI components (shadcn/ui)
- \`lib/\` - Utility functions and shared logic
  - \`lib/apiClient.ts\` - **NEW:** Unified API client
  - \`lib/exportUtils.ts\` - **NEW:** Unified export utilities

### Configuration & Data
- \`prisma/\` - Database schema and migrations
- \`scripts/\` - Build and utility scripts
- \`docs/\` - Documentation

### Testing & Quality
- \`tests/\` - Test files
- \`qa/\` - QA artifacts and reports

---

## 📝 Notes

- Files in \`node_modules/\`, \`.next/\`, \`.git/\`, and build artifacts are excluded
- **Mobile app** (\`mobile/\`) and **uploaded files** (\`private/uploads/\`) are excluded
- File sizes are approximate
- Structure is sorted alphabetically (directories first, then files)

---

*This document is auto-generated. Run \`tsx scripts/generate-structure-doc.ts\` to regenerate.*
`;

  await writeFile(outputPath, markdown, "utf-8");
  console.log(`✅ Structure document generated: ${outputPath}`);
  console.log(
    `   Files: ${stats.files}, Directories: ${
      stats.directories
    }, Size: ${formatSize(stats.totalSize)}`
  );
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
