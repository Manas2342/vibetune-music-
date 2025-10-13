import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const models = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1'
];

const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';
const modelsDir = path.join(__dirname, '..', 'public', 'models');

// Ensure models directory exists
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

function downloadModel(modelName) {
  return new Promise((resolve, reject) => {
    const url = baseUrl + modelName;
    const filePath = path.join(modelsDir, modelName);
    
    console.log(`Downloading ${modelName}...`);
    
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✓ Downloaded ${modelName}`);
          resolve();
        });
      } else {
        console.log(`✗ Failed to download ${modelName}: ${response.statusCode}`);
        resolve(); // Don't reject, just continue with other models
      }
    }).on('error', (err) => {
      console.log(`✗ Error downloading ${modelName}:`, err.message);
      resolve(); // Don't reject, just continue with other models
    });
  });
}

async function downloadAllModels() {
  console.log('Starting face-api.js models download...');
  console.log('Note: If downloads fail, the app will use fallback emotion detection.');
  
  for (const model of models) {
    await downloadModel(model);
  }
  
  console.log('\nModels download completed!');
  console.log('You can now run the application with enhanced face detection.');
}

downloadAllModels().catch(console.error);
