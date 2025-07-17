
// A simple script to reconstruct the project from project_bundle.json
const fs = require('fs');
const path = require('path');
const bundle = require('./project_bundle.json');

console.log('Starting project reconstruction...');

for (const [filePath, content] of Object.entries(bundle)) {
    const dirPath = path.dirname(filePath);
    
    // Create directory if it doesn't exist
    if (dirPath !== '.' && !fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Created directory: ${dirPath}`);
    }
    
    // Write file content
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Created file: ${filePath}`);
}

console.log('\nProject reconstruction complete!');
console.log('Next steps:');
console.log('1. Run `npm install` to install frontend dependencies.');
console.log('2. Follow the instructions in `backend/README.md` to set up the backend.');
