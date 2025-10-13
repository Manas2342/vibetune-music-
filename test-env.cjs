const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log('🔍 Environment Variables Check:');
console.log('SPOTIFY_CLIENT_ID:', process.env.SPOTIFY_CLIENT_ID ? '✅ Set (' + process.env.SPOTIFY_CLIENT_ID.substring(0, 8) + '...)' : '❌ Missing');
console.log('SPOTIFY_CLIENT_SECRET:', process.env.SPOTIFY_CLIENT_SECRET ? '✅ Set (' + process.env.SPOTIFY_CLIENT_SECRET.substring(0, 8) + '...)' : '❌ Missing');
console.log('SPOTIFY_REDIRECT_URI:', process.env.SPOTIFY_REDIRECT_URI || '❌ Missing');

if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
  console.log('\n🎉 All Spotify credentials are configured!');
  console.log('\n📋 Next steps:');
  console.log('1. Make sure your Spotify app has this redirect URI:', process.env.SPOTIFY_REDIRECT_URI);
  console.log('2. Your dev server is running on: http://localhost:8082');
  console.log('3. Navigate to: http://localhost:8082/login');
  console.log('4. Click "Login with Spotify"');
} else {
  console.log('\n❌ Missing Spotify credentials. Check your .env file.');
}
