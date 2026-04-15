#!/usr/bin/env node
/**
 * Diagnostic script to check if analysis files exist and are accessible
 * Run from backend directory: node diagnose.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 ANALYSIS SYSTEM DIAGNOSTIC\n');
console.log('=' .repeat(60));

// Check backend directory
const backendDir = __dirname;
console.log(`\n📍 Backend directory: ${backendDir}`);

// Check analysis files
const filestoCheck = [
  {
    name: 'Analysis Summary JSON',
    path: path.join(backendDir, '../MLModels/MergeModels/outputs/analysis_summary.json')
  },
  {
    name: 'Analysis Report TXT',
    path: path.join(backendDir, '../MLModels/MergeModels/outputs/analysis_report.txt')
  },
  {
    name: 'Final Trading Signals CSV',
    path: path.join(backendDir, '../MLModels/MergeModels/outputs/final_trading_signals.csv')
  }
];

console.log('\n📋 Checking analysis output files:');
console.log('-'.repeat(60));

let allFilesExist = true;

filestoCheck.forEach(file => {
  const exists = fs.existsSync(file.path);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${file.name}`);
  console.log(`   Path: ${file.path}`);
  
  if (exists) {
    try {
      const stats = fs.statSync(file.path);
      console.log(`   Size: ${stats.size} bytes`);
      console.log(`   Modified: ${stats.mtime.toLocaleString()}`);
    } catch (e) {
      console.log(`   ⚠️ Could not read file stats`);
    }
  } else {
    allFilesExist = false;
  }
  console.log('');
});

console.log('=' .repeat(60));

if (allFilesExist) {
  console.log('\n✅ All analysis files found!');
  console.log('\n🚀 Next steps:');
  console.log('   1. Make sure backend is running: npm start');
  console.log('   2. Make sure frontend is running: npm run dev');
  console.log('   3. Check browser console (F12) for any error messages');
  console.log('   4. Try refreshing the page');
} else {
  console.log('\n❌ Some analysis files are missing!');
  console.log('\n🔧 To fix this:');
  console.log('   1. Go to Frontend dashboard');
  console.log('   2. Select a data table');
  console.log('   3. Click "Get ML Insights" button');
  console.log('   4. Wait for ML analysis to complete');
  console.log('   5. Then check if analysis files are created');
  console.log('   6. Run this diagnostic again');
}

console.log('\n');
