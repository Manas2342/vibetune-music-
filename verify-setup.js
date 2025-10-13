#!/usr/bin/env node

/**
 * Quick verification script for Spotify API setup
 * Checks environment variables and configuration
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

console.log('🎵 VibeTune Setup Verification\n');

// Check environment variables
console.log('1. Environment Variables:');
const requiredVars = [
  'SPOTIFY_CLIENT_ID',
  'SPOTIFY_CLIENT_SECRET',
  'SPOTIFY_REDIRECT_URI'
];

let allVarsSet = true;
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`   ✅ ${varName}: ${varName === 'SPOTIFY_CLIENT_SECRET' ? '*'.repeat(10) : value}`);
  } else {
    console.log(`   ❌ ${varName}: Missing`);
    allVarsSet = false;
  }
});

// Check critical files
console.log('\n2. Critical Files:');
const criticalFiles = [
  'server/index.ts',
  'server/services/spotifyService.ts', 
  'server/routes/auth.ts',
  'server/routes/spotify.ts',
  'client/services/spotifyService.ts',
  'client/contexts/AuthContext.tsx',
  'client/pages/Login.tsx',
  'client/pages/SpotifyCallback.tsx'
];

criticalFiles.forEach(filePath => {
  const fullPath = path.resolve(filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`   ✅ ${filePath}`);
  } else {
    console.log(`   ❌ ${filePath}: Missing`);
  }
});

// Check package.json scripts
console.log('\n3. Package Scripts:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredScripts = ['dev', 'build', 'start'];
  
  requiredScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`   ✅ npm run ${script}`);
    } else {
      console.log(`   ❌ npm run ${script}: Missing`);
    }
  });
} catch (error) {
  console.log('   ❌ Could not read package.json');
}

// Configuration summary
console.log('\n4. Configuration Summary:');
console.log(`   🌍 Frontend: http://localhost:8080`);
console.log(`   🔧 Backend: http://localhost:8080/api`);
console.log(`   🔗 Redirect URI: ${process.env.SPOTIFY_REDIRECT_URI || 'Not set'}`);

// Final status
if (allVarsSet) {
  console.log('\n🎉 Setup looks good! Next steps:');
  console.log('   1. Run: npm run dev');
  console.log('   2. Open: http://localhost:8080/login');
  console.log('   3. Click "Continue with Spotify"');
  console.log('   4. Complete OAuth flow');
  console.log('\n📋 Make sure your Spotify App settings include:');
  console.log(`   - Redirect URI: ${process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:8080/callback'}`);
} else {
  console.log('\n⚠️  Please fix missing environment variables in .env file');
  console.log('📖 See SPOTIFY_SETUP.md for detailed instructions');
}

// Development tips
console.log('\n💡 Development Tips:');
console.log('   - Keep your .env file secure and never commit it');
console.log('   - Update Spotify app redirect URI if you change ports');
console.log('   - Check browser console for client-side errors');
console.log('   - Check terminal for server-side errors');
