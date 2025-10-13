const axios = require('axios');
require('dotenv').config();

// Test YouTube API directly
async function testYouTubeAPI() {
  console.log('🔍 Testing YouTube API directly...');
  console.log('API Key:', process.env.YOUTUBE_API_KEY ? 'Present ✅' : 'Missing ❌');
  
  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: 'taylor swift music',
        type: 'video',
        maxResults: 2,
        key: process.env.YOUTUBE_API_KEY,
        videoCategoryId: '10' // Music category
      }
    });
    
    console.log('✅ YouTube API Test Successful!');
    console.log(`Found ${response.data.items.length} results`);
    
    response.data.items.forEach((item, index) => {
      console.log(`${index + 1}. ${item.snippet.title}`);
      console.log(`   Channel: ${item.snippet.channelTitle}`);
      console.log(`   Video ID: ${item.id.videoId}`);
    });
    
    return true;
  } catch (error) {
    console.log('❌ YouTube API Test Failed');
    console.log('Error:', error.response?.data || error.message);
    return false;
  }
}

// Test YouTube Service (local service wrapper)
async function testYouTubeService() {
  console.log('\n🔍 Testing YouTube Service...');
  
  try {
    // Import the service
    const youtubeService = require('./server/services/youtubeService.ts');
    
    // Test search functionality
    const searchResult = await youtubeService.default.search('taylor swift', 'track', 2);
    
    console.log('✅ YouTube Service Test Successful!');
    console.log(`Found ${searchResult.tracks.items.length} tracks`);
    
    searchResult.tracks.items.forEach((track, index) => {
      console.log(`${index + 1}. ${track.name} by ${track.artists[0].name}`);
      console.log(`   ID: ${track.id}`);
    });
    
    return true;
  } catch (error) {
    console.log('❌ YouTube Service Test Failed');
    console.log('Error:', error.message);
    return false;
  }
}

// Test local server API
async function testLocalAPI() {
  console.log('\n🔍 Testing Local Server API...');
  
  try {
    const response = await axios.get('http://localhost:8080/api/search', {
      params: {
        q: 'taylor swift',
        type: 'track',
        limit: 2
      },
      timeout: 10000 // 10 second timeout
    });
    
    console.log('✅ Local Server API Test Successful!');
    console.log(`Found ${response.data.tracks.items.length} tracks`);
    
    response.data.tracks.items.forEach((track, index) => {
      console.log(`${index + 1}. ${track.name} by ${track.artists[0].name}`);
      console.log(`   ID: ${track.id}`);
    });
    
    return true;
  } catch (error) {
    console.log('❌ Local Server API Test Failed');
    if (error.code === 'ECONNREFUSED') {
      console.log('Error: Server is not running on port 8080');
      console.log('Make sure to run: npm run dev');
    } else if (error.code === 'ECONNABORTED') {
      console.log('Error: Request timed out - server might be hanging');
    } else {
      console.log('Error:', error.response?.data || error.message);
    }
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 VibeTune YouTube API Connection Test');
  console.log('=====================================\n');
  
  const results = {
    youtubeAPI: await testYouTubeAPI(),
    youtubeService: await testYouTubeService(),
    localAPI: await testLocalAPI()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`YouTube API Direct: ${results.youtubeAPI ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`YouTube Service: ${results.youtubeService ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Local Server API: ${results.localAPI ? '✅ PASS' : '❌ FAIL'}`);
  
  if (results.youtubeAPI && results.youtubeService && results.localAPI) {
    console.log('\n🎉 All tests passed! Your VibeTune app is connected to YouTube API!');
  } else if (results.youtubeAPI && results.youtubeService) {
    console.log('\n⚠️  YouTube API is working, but local server has issues. Please ensure:');
    console.log('   1. Server is running with: npm run dev');
    console.log('   2. No other processes are using port 8080');
    console.log('   3. Restart the server after updating the API key');
  } else {
    console.log('\n🚨 Some tests failed. Please check the configuration.');
  }
}

runTests().catch(console.error);
