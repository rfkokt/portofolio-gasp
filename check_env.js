const fs = require('fs');
const path = require('path');

try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/NEXT_PUBLIC_POCKETBASE_URL=(.*)/);
    if (match) {
      console.log('Found URL in .env:', match[1]);
    } else {
      console.log('NEXT_PUBLIC_POCKETBASE_URL not found in .env');
    }
  } else {
    console.log('.env file not found');
  }
} catch (e) {
  console.error('Error reading .env:', e);
}
