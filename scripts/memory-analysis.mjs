/**
 * Memory Usage Analysis for Next.js Development
 * 
 * This script provides insights into potential memory optimization opportunities
 * in your Next.js application by analyzing common memory-intensive patterns.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * Analyze components for potential memory inefficiencies
 */
async function analyzeComponents() {
  const componentDir = path.join(projectRoot, 'components');
  const results = {
    potentialIssues: [],
    recommendations: []
  };

  try {
    const files = await getFilesRecursive(componentDir, ['.tsx', '.jsx', '.js', '.ts']);
    
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      
      // Check for components that might cause memory issues
      const componentName = path.basename(file, path.extname(file));
      
      // Check for missing cleanup in effects
      const cleanupRegex = /(useEffect|useLayoutEffect)\s*\([^}]*cleanup|return\s*[^}]*function|return\s*[^}]*\(\)|return\s*{[^}]*dispose|return\s*{[^}]*destroy/g;
      if (!cleanupRegex.test(content)) {
        // This is a simplified check - in real usage, we'd need more sophisticated parsing
        if (content.includes('useEffect') || content.includes('setInterval') || content.includes('setTimeout') || content.includes('addEventListener')) {
          results.potentialIssues.push({
            file: path.relative(projectRoot, file),
            component: componentName,
            issue: 'Potential missing cleanup in useEffect - may cause memory leaks'
          });
        }
      }
      
      // Check for large dependency arrays
      const depsRegex = /useMemo\s*\([^,]*,\s*\[[^\]]{50,}\]/g;
      if (depsRegex.test(content)) {
        results.potentialIssues.push({
          file: path.relative(projectRoot, file),
          component: componentName,
          issue: 'Large dependency array in useMemo - consider using useCallback for dependencies'
        });
      }
    }
  } catch (error) {
    console.error('Error analyzing components:', error);
  }

  return results;
}

/**
 * Get all files in a directory recursively
 */
async function getFilesRecursive(dir, extensions) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFilesRecursive(res, extensions) : res;
  }));
  return files.flat().filter(file => extensions.includes(path.extname(file)));
}

/**
 * Analyze dependencies for potential bundle size issues
 */
async function analyzeDependencies() {
  try {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    
    const heavyDependencies = [];
    const devDependencies = packageJson.devDependencies || {};
    const dependencies = packageJson.dependencies || {};
    
    // Common heavy dependencies that might impact memory
    const potentiallyHeavyDeps = [
      'three', 'react-three', 'd3', 'chart.js', 'recharts', 
      'moment', 'lodash', 'ramda', 'immer', 'zustand', 
      '@react-pdf', 'jspdf', 'prisma'
    ];
    
    for (const [depName, depVersion] of Object.entries({...dependencies, ...devDependencies})) {
      if (potentiallyHeavyDeps.some(heavy => depName.includes(heavy))) {
        heavyDependencies.push({
          name: depName,
          version: depVersion
        });
      }
    }
    
    return heavyDependencies;
  } catch (error) {
    console.error('Error analyzing dependencies:', error);
    return [];
  }
}

/**
 * Analyze images and assets
 */
async function analyzeAssets() {
  const publicDir = path.join(projectRoot, 'public');
  const results = {
    imageCount: 0,
    largeImages: [],
    totalSize: 0
  };

  try {
    const files = await getFilesRecursive(publicDir, ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']);
    
    for (const file of files) {
      const stats = await fs.stat(file);
      results.totalSize += stats.size;
      results.imageCount++;
      
      // Check for images larger than 1MB
      if (stats.size > 1024 * 1024) {
        results.largeImages.push({
          file: path.relative(projectRoot, file),
          size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB'
        });
      }
    }
  } catch (error) {
    console.error('Error analyzing assets:', error);
  }

  return results;
}

/**
 * Run comprehensive memory analysis
 */
async function runAnalysis() {
  console.log('🔍 Running Memory Usage Analysis...\n');
  
  // Run all analysis functions in parallel
  const [componentAnalysis, dependencyAnalysis, assetAnalysis] = await Promise.all([
    analyzeComponents(),
    analyzeDependencies(),
    analyzeAssets()
  ]);
  
  console.log('📊 COMPONENT ANALYSIS RESULTS:');
  console.log('=====================================');
  if (componentAnalysis.potentialIssues.length > 0) {
    console.log(`⚠️  Found ${componentAnalysis.potentialIssues.length} potential memory issues in components:\n`);
    componentAnalysis.potentialIssues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.component} (${issue.file})`);
      console.log(`   Issue: ${issue.issue}\n`);
    });
  } else {
    console.log('✅ No obvious memory issues found in components.\n');
  }
  
  console.log('📦 DEPENDENCY ANALYSIS RESULTS:');
  console.log('=====================================');
  if (dependencyAnalysis.length > 0) {
    console.log(`📦 Found ${dependencyAnalysis.length} potentially heavy dependencies:\n`);
    dependencyAnalysis.forEach((dep, index) => {
      console.log(`${index + 1}. ${dep.name}: ${dep.version}`);
    });
    console.log('\n💡 Consider using tree-shaking or alternative lighter libraries where possible.\n');
  } else {
    console.log('✅ No obviously heavy dependencies found.\n');
  }
  
  console.log('🖼️  ASSET ANALYSIS RESULTS:');
  console.log('=====================================');
  console.log(`🖼️  Total images found: ${assetAnalysis.imageCount}`);
  console.log(`💾 Total size: ${(assetAnalysis.totalSize / (1024 * 1024)).toFixed(2)} MB\n`);
  
  if (assetAnalysis.largeImages.length > 0) {
    console.log(`⚠️  Found ${assetAnalysis.largeImages.length} large images (>1MB):\n`);
    assetAnalysis.largeImages.forEach((img, index) => {
      console.log(`${index + 1}. ${img.file} (${img.size})`);
    });
    console.log('\n💡 Consider optimizing these images or using lazy loading.\n');
  } else {
    console.log('✅ No images larger than 1MB found.\n');
  }
  
  console.log('💡 MEMORY OPTIMIZATION RECOMMENDATIONS:');
  console.log('========================================');
  console.log('1. Use the optimized development scripts: npm run dev:low-memory');
  console.log('2. Implement proper cleanup in useEffect hooks');
  console.log('3. Use React.memo() for components that render frequently');
  console.log('4. Implement code splitting for large components');
  console.log('5. Use Next.js Image component with appropriate sizing');
  console.log('6. Consider using dynamic imports for heavy libraries');
  console.log('7. Optimize images and use modern formats (WebP, AVIF)');
}

// Run the analysis
runAnalysis().catch(console.error);