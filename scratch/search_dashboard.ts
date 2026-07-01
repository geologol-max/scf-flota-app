import fs from 'fs';
import path from 'path';

const fileContent = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf-8');
const lines = fileContent.split('\n');

console.log('Searching for dashboard components in App.tsx:');
lines.forEach((line, idx) => {
  if (line.includes('activeTab ===') && (line.includes('dashboard') || line.includes('tablero'))) {
    console.log(`Line ${idx + 1}:`);
    for (let i = Math.max(0, idx - 5); i < Math.min(lines.length, idx + 40); i++) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
  }
});
