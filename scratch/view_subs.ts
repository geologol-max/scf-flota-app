import fs from 'fs';
import path from 'path';

const fileContent = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf-8');
const lines = fileContent.split('\n');

// Find lines containing "subscribeToUsers"
lines.forEach((line, idx) => {
  if (line.includes('subscribeToUsers')) {
    console.log(`Line ${idx + 1}:`);
    for (let i = Math.max(0, idx - 10); i < Math.min(lines.length, idx + 40); i++) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
  }
});
