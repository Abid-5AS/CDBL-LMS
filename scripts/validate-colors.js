#!/usr/bin/env node

/**
 * Validation script to detect broken color class patterns in the codebase
 * Run this script to ensure no invalid color classes are present
 *
 * Usage: node scripts/validate-colors.js
 * Or add to package.json: "validate:colors": "node scripts/validate-colors.js"
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Broken patterns to detect
const BROKEN_PATTERNS = [
  {
    pattern: /\bbg-bg-(?!primary-foreground|secondary-foreground)/g,
    description: 'bg-bg-* classes (should be bg-card, bg-secondary, bg-muted)',
  },
  {
    pattern: /\btext-text-(?!foreground)/g,
    description: 'text-text-* classes (should be text-foreground, text-muted-foreground)',
  },
  {
    pattern: /\bborder-border-strong\b/g,
    description: 'border-border-strong (should be border-border with dark variants)',
  },
  {
    pattern: /\bbg-data-(?!info-foreground|warning-foreground|success-foreground|error-foreground)/g,
    description: 'bg-data-* classes (should be bg-info, bg-warning, bg-success, bg-danger)',
  },
  {
    pattern: /\btext-data-(?!info|warning|success|error)\b/g,
    description: 'text-data-* classes (should be text-info, text-warning, etc.)',
  },
];

function validateColorClasses() {
  console.log('🔍 Validating color classes in the codebase...\n');

  try {
    // Find all TypeScript/TSX files
    const files = glob.sync('**/*.{ts,tsx}', {
      cwd: process.cwd(),
      ignore: [
        'node_modules/**',
        '.next/**',
        'dist/**',
        'build/**',
        'coverage/**',
        'scripts/**',
      ],
    });

    let totalErrors = 0;
    const errorsByFile = {};

    // Check each file
    for (const file of files) {
      const filePath = path.join(process.cwd(), file);
      const content = fs.readFileSync(filePath, 'utf8');
      const fileErrors = [];

      // Check for each broken pattern
      for (const { pattern, description } of BROKEN_PATTERNS) {
        const matches = content.match(pattern);
        if (matches) {
          const uniqueMatches = [...new Set(matches)];
          fileErrors.push({
            pattern: description,
            matches: uniqueMatches,
            count: matches.length,
          });
        }
      }

      if (fileErrors.length > 0) {
        errorsByFile[file] = fileErrors;
        totalErrors += fileErrors.reduce((sum, err) => sum + err.count, 0);
      }
    }

    // Report results
    if (totalErrors === 0) {
      console.log('✅ Success! No broken color class patterns found.');
      console.log(`   Scanned ${files.length} files.`);
      return true;
    } else {
      console.error(`❌ Found ${totalErrors} broken color class patterns in ${Object.keys(errorsByFile).length} files:\n`);

      for (const [file, errors] of Object.entries(errorsByFile)) {
        console.error(`\n📄 ${file}`);
        for (const error of errors) {
          console.error(`   ⚠️  ${error.pattern}`);
          console.error(`      Found ${error.count}x: ${error.matches.join(', ')}`);
        }
      }

      console.error('\n💡 To fix these issues:');
      console.error('   - bg-bg-* → Use bg-card, bg-secondary, or bg-muted');
      console.error('   - text-text-* → Use text-foreground or text-muted-foreground');
      console.error('   - border-border-strong → Use border-border with dark: variants');
      console.error('   - bg-data-* → Use bg-info, bg-warning, bg-success, bg-danger');
      console.error('   - text-data-* → Use text-info, text-warning, etc.');

      return false;
    }
  } catch (error) {
    console.error('❌ Error running validation:', error.message);
    return false;
  }
}

// Run validation
const success = validateColorClasses();
process.exit(success ? 0 : 1);
