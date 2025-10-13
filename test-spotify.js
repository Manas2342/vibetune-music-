#!/usr/bin/env node

/**
 * Test script for Spotify API integration
 * Run with: node test-spotify.js
 */

import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

const BASE_URL = 'http://localhost:8080/api';

async function testSpotifyIntegration() {
  console.log('🎵 Testing VibeTune Spotify API Integration\n');

  try {
    // Test 1: Health check
    console.log('1. Testing server health...');
    const healthResponse = await axios.get(`${BASE_URL}/ping`);
    console.log('   ✅ Server is running:', healthResponse.data.message);

    // Test 2: Spotify auth URL generation
    console.log('\n2. Testing Spotify auth URL generation...');
    const authResponse = await axios.get(`${BASE_URL}/auth/spotify/url`);
    console.log('   ✅ Auth URL generated successfully');
    console.log('   🔗 Auth URL:', authResponse.data.authUrl);

    // Test 3: Public search (without authentication)
    console.log('\n3. Testing public search functionality...');
    try {
      const searchResponse = await axios.get(`${BASE_URL}/spotify/search?q=taylor swift&type=track&limit=5`);
      
      if (searchResponse.data.tracks && searchResponse.data.tracks.items.length > 0) {
        console.log('   ✅ Public search working');
        console.log(`   📀 Found ${searchResponse.data.tracks.items.length} tracks`);
        console.log(`   🎤 Example track: "${searchResponse.data.tracks.items[0].name}" by ${searchResponse.data.tracks.items[0].artists[0].name}`);
      } else {
        console.log('   ⚠️  Search returned no results (this might indicate missing Spotify credentials)');
      }
    } catch (searchError) {
      if (searchError.response?.status === 500) {
        console.log('   ❌ Public search failed - likely missing Spotify credentials');
        console.log('   💡 Make sure SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are set in .env');
      } else {
        throw searchError;
      }
    }

    // Test 4: Environment variables check
    console.log('\n4. Checking environment configuration...');
    const requiredVars = [
      'SPOTIFY_CLIENT_ID',
      'SPOTIFY_CLIENT_SECRET',
      'SPOTIFY_REDIRECT_URI'
    ];

    let allVarsSet = true;
    requiredVars.forEach(varName => {
      if (process.env[varName]) {
        console.log(`   ✅ ${varName} is set`);
      } else {
        console.log(`   ❌ ${varName} is missing`);
        allVarsSet = false;
      }
    });

    if (allVarsSet) {
      console.log('\n🎉 All tests passed! Your Spotify integration is ready to use.');
      console.log('\n📋 Next steps:');
      console.log('   1. Go to http://localhost:8080/login');
      console.log('   2. Click "Login with Spotify"');
      console.log('   3. Complete the OAuth flow');
      console.log('   4. Start exploring music!');
    } else {
      console.log('\n⚠️  Some environment variables are missing.');
      console.log('📖 Please check SPOTIFY_SETUP.md for configuration instructions.');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 The server doesn\'t seem to be running.');
      console.log('   Start it with: npm run dev');
    } else if (error.response) {
      console.log(`   HTTP ${error.response.status}: ${error.response.statusText}`);
    }
    
    console.log('\n📖 Check SPOTIFY_SETUP.md for troubleshooting tips.');
    process.exit(1);
  }
}

// Run the tests
testSpotifyIntegration();
