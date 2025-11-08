import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PREFIX_GROUP = {
  bg: "background",
  from: "background",
  to: "background",
  via: "background",
  text: "text",
  stroke: "text",
  border: "border",
  ring: "border",
};

const NEUTRAL_FAMILIES = new Set(["slate", "gray", "neutral", "stone", "zinc"]);
const INFO_FAMILIES = new Set(["blue", "sky", "cyan"]);
const SUCCESS_FAMILIES = new Set(["green", "emerald", "teal", "lime"]);
const WARNING_FAMILIES = new Set(["amber", "yellow", "orange"]);
const DANGER_FAMILIES = new Set(["red", "rose"]);
const ACTION_FAMILIES = new Set(["indigo"]);
const SUMMARY_FAMILIES = new Set(["purple", "violet"]);
const MATERNITY_FAMILIES = new Set(["pink"]);

const COLOR_FAMILIES = [
  ...NEUTRAL_FAMILIES,
  ...INFO_FAMILIES,
  ...SUCCESS_FAMILIES,
  ...WARNING_FAMILIES,
  ...DANGER_FAMILIES,
  ...ACTION_FAMILIES,
  ...SUMMARY_FAMILIES,
  ...MATERNITY_FAMILIES,
  "white",
  "black",
];

const PREFIXES = ["bg", "from", "to", "via", "text", "stroke", "border", "ring"];

const COLOR_REGEX = new RegExp(
  `\\b(?:${PREFIXES.join("|")})-(?:${COLOR_FAMILIES.join(
    "|"
  )})(?:-\\d{2,3})?(?:/\\d{1,3})?`,
  "g"
);

const TARGET_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".css",
  ".md",
]);

const IGNORE_DIRS = new Set([
  ".git",
  "node_modules",
  ".next",
  ".next-dev",
  "dist",
  ".turbo",
  "coverage",
  "build",
  "public",
  "private",
  "tests",
  "qa",
  "docs",
  "scripts",
  "reports",
  "prisma",
  ".cursor",
  ".vscode",
  ".tmp",
]);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

function describeSemantic(family) {
  if (INFO_FAMILIES.has(family)) {
    return { base: "data-info", supportsVariants: true };
  }
  if (SUCCESS_FAMILIES.has(family)) {
    return { base: "data-success", supportsVariants: true };
  }
  if (WARNING_FAMILIES.has(family)) {
    return { base: "data-warning", supportsVariants: true };
  }
  if (DANGER_FAMILIES.has(family)) {
    return { base: "data-error", supportsVariants: true };
  }
  if (ACTION_FAMILIES.has(family)) {
    return { base: "card-action", supportsVariants: true };
  }
  if (SUMMARY_FAMILIES.has(family)) {
    return { base: "card-summary", supportsVariants: true };
  }
  if (MATERNITY_FAMILIES.has(family)) {
    return { base: "leave-maternity", supportsVariants: false };
  }
  return null;
}

function parseToken(token) {
  const [base, alpha] = token.split("/");
  const [prefix, colorPart] = base.split("-", 2);
  if (!prefix || !colorPart) return null;
  if (!PREFIXES.includes(prefix)) return null;
  const match = colorPart.match(/^([a-z]+)(?:-(\d{2,3}))?$/);
  if (!match) return null;
  const family = match[1];
  const shade = match[2] ? Number(match[2]) : null;
  return {
    prefix,
    family,
    shade: Number.isFinite(shade) ? shade : null,
    alpha: alpha ?? null,
  };
}

function variantForShade(shade) {
  if (shade === null) return "default";
  if (shade <= 200) return "soft";
  if (shade >= 700) return "strong";
  return "default";
}

function fallbackBackgroundAlpha(shade) {
  if (shade === null) return null;
  if (shade <= 50) return "10";
  if (shade <= 100) return "15";
  if (shade <= 200) return "25";
  if (shade >= 900) return "80";
  if (shade >= 800) return "70";
  if (shade >= 700) return "60";
  return null;
}

function textAlphaAdjustment(shade) {
  if (shade === null) return null;
  if (shade <= 200) return "80";
  if (shade <= 400) return "90";
  return null;
}

function mapNeutralText(shade) {
  if (shade === null) return "text-text-secondary";
  if (shade >= 800) return "text-text-primary";
  if (shade >= 600) return "text-text-secondary";
  if (shade >= 500) return "text-text-muted";
  if (shade >= 400) return "text-text-muted";
  if (shade >= 200) return "text-text-tertiary";
  return "text-text-inverted";
}

function mapNeutralBackground(family, shade) {
  if (family === "white") return "bg-bg-primary";
  if (family === "black") return "bg-bg-inverted";
  if (shade === null) return "bg-bg-secondary";
  if (shade <= 50) return "bg-bg-primary";
  if (shade <= 100) return "bg-bg-secondary";
  if (shade <= 200) return "bg-bg-tertiary";
  if (shade <= 400) return "bg-bg-muted";
  return "bg-bg-inverted";
}

function mapNeutralBorder(family, shade, prefix) {
  if (family === "white") return `${prefix}-bg-primary`;
  if (family === "black") return `${prefix}-bg-inverted`;
  if (shade !== null && shade <= 200) return `${prefix}-border-default`;
  return `${prefix}-border-strong`;
}

function mapNeutral(token) {
  if (token.prefix === "text" || token.prefix === "stroke") {
    if (token.family === "white") {
      return { color: "text-text-inverted" };
    }
    if (token.family === "black") {
      return { color: "text-text-primary" };
    }
    return { color: mapNeutralText(token.shade) };
  }

  if (token.prefix === "bg" || token.prefix === "from" || token.prefix === "to" || token.prefix === "via") {
    return { color: mapNeutralBackground(token.family, token.shade) };
  }

  if (token.prefix === "border" || token.prefix === "ring") {
    return {
      color: mapNeutralBorder(
        token.family,
        token.shade,
        token.prefix === "ring" ? "ring" : "border"
      ),
    };
  }

  return { color: `${token.prefix}-text-primary` };
}

function mapSemanticToken(token, descriptor) {
  const group = PREFIX_GROUP[token.prefix];
  const baseName = descriptor.base;

  if (group === "background") {
    let colorName = baseName;
    if (descriptor.supportsVariants) {
      const variant = variantForShade(token.shade);
      if (variant === "soft") {
        colorName = `${baseName}-soft`;
      } else if (variant === "strong") {
        colorName = `${baseName}-strong`;
      }
    }

    const fallbackAlpha =
      descriptor.supportsVariants || token.alpha
        ? null
        : fallbackBackgroundAlpha(token.shade);

    return {
      color: `${token.prefix}-${colorName}`,
      alpha: fallbackAlpha ?? undefined,
    };
  }

  if (group === "border") {
    let colorName = baseName;
    if (descriptor.supportsVariants) {
      const variant = variantForShade(token.shade);
      if (variant === "soft") {
        colorName = `${baseName}-soft`;
      } else if (variant === "strong") {
        colorName = `${baseName}-strong`;
      }
    }
    return { color: `${token.prefix}-${colorName}` };
  }

  const alphaAdjustment =
    token.alpha ?? textAlphaAdjustment(token.shade) ?? undefined;
  return {
    color: `${token.prefix}-${baseName}`,
    alpha: token.alpha ? undefined : alphaAdjustment,
  };
}

function mapColorToken(token) {
  const parsed = parseToken(token);
  if (!parsed) return null;

  if (
    NEUTRAL_FAMILIES.has(parsed.family) ||
    parsed.family === "white" ||
    parsed.family === "black"
  ) {
    const mapped = mapNeutral(parsed);
    return appendAlpha(mapped.color, parsed.alpha ?? mapped.alpha);
  }

  const descriptor = describeSemantic(parsed.family);
  if (!descriptor) {
    return null;
  }

  const mapped = mapSemanticToken(parsed, descriptor);
  if (!mapped) return null;
  const alpha = parsed.alpha ?? mapped.alpha;
  return appendAlpha(mapped.color, alpha);
}

function appendAlpha(color, alpha) {
  if (!alpha) return color;
  return `${color}/${alpha}`;
}

async function collectFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
      continue;
    }
    if (TARGET_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

async function processFile(file, write, unknownTokens) {
  const original = await fs.readFile(file, "utf8");
  let replacements = 0;

  const updated = original.replace(COLOR_REGEX, (match) => {
    const mapped = mapColorToken(match);
    if (!mapped) {
      unknownTokens.add(match);
      return match;
    }
    if (mapped !== match) {
      replacements += 1;
    }
    return mapped;
  });

  if (replacements > 0 && write && updated !== original) {
    await fs.writeFile(file, updated, "utf8");
  }

  return { replacements, changed: replacements > 0 };
}

async function main() {
  const write = process.argv.includes("--write") || process.argv.includes("-w");
  const files = await collectFiles(ROOT);
  let totalReplacements = 0;
  let changedFiles = 0;
  const unknownTokens = new Set();

  for (const file of files) {
    const { replacements, changed } = await processFile(
      file,
      write,
      unknownTokens
    );
    totalReplacements += replacements;
    if (changed) {
      changedFiles += 1;
      if (!write) {
        console.log(`[dry-run] ${file} -> ${replacements} replacements`);
      }
    }
  }

  const modeLabel = write ? "updated" : "would update";
  console.log(
    `${modeLabel} ${changedFiles} files with ${totalReplacements} replacements.`
  );

  if (unknownTokens.size > 0) {
    console.warn(
      `Unmapped tokens (${unknownTokens.size}): ${Array.from(
        unknownTokens
      ).join(", ")}`
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
