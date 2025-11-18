#!/usr/bin/env node

/**
 * Memory Monitoring Script
 * 
 * This script helps monitor memory usage of the Next.js development server
 * and can detect potential memory leaks or excessive memory consumption.
 */

const { spawn, exec } = require('child_process');
const os = require('os');

// Configuration
const MONITOR_INTERVAL = 5000; // 5 seconds
const MAX_MEMORY_THRESHOLD = 4096; // 4GB in MB
const REPORT_INTERVAL = 30000; // Report every 30 seconds

// Store memory usage history
let memoryHistory = [];

function getProcessMemoryUsage(processName) {
  return new Promise((resolve, reject) => {
    const platform = os.platform();
    
    let command;
    if (platform === 'win32') {
      command = `tasklist /FI "IMAGENAME eq ${processName}" /FO CSV /NH`;
    } else {
      // Unix-like systems
      command = `ps aux | grep '${processName}' | grep -v grep | awk '{print $2, $4, $6}'`;
    }
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      
      if (!stdout.trim()) {
        resolve(null);
        return;
      }
      
      const lines = stdout.trim().split('\n');
      const processes = [];
      
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 3) {
          processes.push({
            pid: parts[0],
            cpu: parseFloat(parts[1]),
            memory: parseFloat(parts[2]) // in KB on Unix, percentage on Windows
          });
        }
      });
      
      resolve(processes);
    });
  });
}

function getSystemMemoryInfo() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsagePercent = (usedMemory / totalMemory) * 100;
  
  return {
    total: totalMemory / (1024 * 1024), // Convert to MB
    free: freeMemory / (1024 * 1024),
    used: usedMemory / (1024 * 1024),
    percent: memoryUsagePercent
  };
}

function logMemorySnapshot() {
  const timestamp = new Date().toISOString();
  const systemMemory = getSystemMemoryInfo();
  
  console.log(`\n[${timestamp}] Memory Usage Report:`);
  console.log(`System Memory - Total: ${systemMemory.total.toFixed(2)} MB, Used: ${systemMemory.used.toFixed(2)} MB, Free: ${systemMemory.free.toFixed(2)} MB (${systemMemory.percent.toFixed(2)}%)`);
  
  // Track system memory for history
  memoryHistory.push({
    timestamp,
    systemMemory
  });
  
  // Keep only last 20 entries to prevent excessive memory usage
  if (memoryHistory.length > 20) {
    memoryHistory = memoryHistory.slice(-20);
  }
}

function detectMemoryAnomalies() {
  if (memoryHistory.length < 2) return;
  
  const recentData = memoryHistory.slice(-10); // Last 10 measurements
  const initialMemory = recentData[0].systemMemory.used;
  const currentMemory = recentData[recentData.length - 1].systemMemory.used;
  
  // Calculate memory increase
  const memoryIncrease = currentMemory - initialMemory;
  const percentIncrease = (memoryIncrease / initialMemory) * 100;
  
  if (percentIncrease > 10) { // If memory increased by more than 10%
    console.warn(`⚠️  Potential memory increase detected: ${percentIncrease.toFixed(2)}% over ${recentData.length} measurements`);
  }
  
  // Check for sustained high memory usage
  const avgMemory = recentData.reduce((sum, entry) => sum + entry.systemMemory.used, 0) / recentData.length;
  if (avgMemory > MAX_MEMORY_THRESHOLD * 0.8) { // 80% of threshold
    console.warn(`⚠️  Sustained high memory usage: Average ${avgMemory.toFixed(2)} MB over ${recentData.length} measurements`);
  }
}

function startMonitoring() {
  console.log('🔍 Starting memory monitoring for Next.js development server...');
  console.log(`📊 Monitoring interval: ${MONITOR_INTERVAL / 1000} seconds`);
  console.log(`📊 Memory threshold: ${MAX_MEMORY_THRESHOLD} MB`);
  console.log(`📊 Report interval: ${REPORT_INTERVAL / 1000} seconds\n`);
  
  // Initial memory snapshot
  logMemorySnapshot();
  
  // Set up regular monitoring
  setInterval(() => {
    logMemorySnapshot();
  }, MONITOR_INTERVAL);
  
  // Set up anomaly detection
  setInterval(() => {
    detectMemoryAnomalies();
  }, REPORT_INTERVAL);
}

// Detect if we're in a development environment and monitor appropriately
function isDevelopmentServerRunning() {
  return new Promise((resolve) => {
    exec('lsof -i :3000', (error, stdout) => {
      // If port 3000 is in use (common Next.js dev port), assume dev server is running
      resolve(!error && stdout.includes('LISTEN'));
    });
  });
}

async function main() {
  console.log('🚀 Memory Monitoring Tool for Next.js');
  console.log('=====================================');
  
  const isDevServerRunning = await isDevelopmentServerRunning();
  
  if (isDevServerRunning) {
    console.log('✅ Next.js development server appears to be running on port 3000');
  } else {
    console.log('⚠️  Next.js development server does not appear to be running on port 3000');
    console.log('💡 Start your development server with `npm run dev` before running this monitor');
  }
  
  // Start monitoring regardless
  startMonitoring();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Memory monitoring stopped.');
  console.log(`📊 Final memory history: ${memoryHistory.length} measurements captured`);
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception in memory monitor:', err);
  process.exit(1);
});

// Run the main function
main().catch(console.error);