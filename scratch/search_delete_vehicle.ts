import fs from 'fs';
import path from 'path';

const fileContent = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf-8');
const lines = fileContent.split('\n');

console.log('Searching for "deleteVehicle" in App.tsx:');
lines.forEach((line, idx) => {
  if (line.includes('deleteVehicle')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
