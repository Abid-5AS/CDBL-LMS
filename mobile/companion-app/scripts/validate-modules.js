/**
 * Script to validate module imports and exports in the mobile application
 * This will help ensure all modules have proper imports that are available in the development build
 */

const fs = require('fs');
const path = require('path');

// Check if secure store is available
let hasSecureStore = false;
let hasAsyncStorage = false;

try {
  require('expo-secure-store');
  hasSecureStore = true;
  console.log('✅ expo-secure-store is available');
} catch (e) {
  console.log('⚠️  expo-secure-store is not available');
}

try {
  require('@react-native-async-storage/async-storage');
  hasAsyncStorage = true;
  console.log('✅ @react-native-async-storage/async-storage is available');
} catch (e) {
  console.log('⚠️  @react-native-async-storage/async-storage is not available');
}

if (!hasSecureStore && !hasAsyncStorage) {
  console.log('⚠️  Neither secure store nor async storage is available. This could cause issues in development.');
  console.log('💡 Install one of these packages:');
  console.log('   expo install expo-secure-store');
  console.log('   or');
  console.log('   npx expo install @react-native-async-storage/async-storage');
} else if (!hasSecureStore) {
  console.log('📝 Note: Using AsyncStorage as fallback for secure storage');
} else {
  console.log('🔐 Secure storage is properly configured');
}

// Check all .tsx files in app directory for proper exports
const appDir = path.join(__dirname, '..', 'app');
const checkExports = (dir) => {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      checkExports(fullPath);
    } else if (item.endsWith('.tsx') && !item.includes('types.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (!content.includes('export default')) {
        console.log(`⚠️  Missing default export: ${fullPath}`);
      } else {
        console.log(`✅ Has default export: ${path.relative(appDir, fullPath)}`);
      }
    }
  }
};

console.log('\n🔍 Checking route files for default exports...');
checkExports(appDir);

console.log('\n✅ Validation complete!');