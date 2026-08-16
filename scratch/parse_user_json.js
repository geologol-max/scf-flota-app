import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const logDir = 'C:\\Users\\bebej\\.gemini\\antigravity\\brain\\49f5a89c-23cd-4ab5-a709-fa12f0fa744d\\.system_generated\\logs';
const transcriptPath = path.join(logDir, 'transcript.jsonl');

if (fs.existsSync(transcriptPath)) {
  const content = fs.readFileSync(transcriptPath, 'utf-8');
  const lines = content.split('\n');
  
  // Scan backwards for the user request containing JSON
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (line.includes('-----BEGIN PRIVATE KEY-----') && line.includes('"type":"USER_INPUT"')) {
      try {
        const obj = JSON.parse(line);
        const text = obj.content || '';
        const jsonMatch = text.match(/\{[\s\S]*"private_key"[\s\S]*\}/);
        if (jsonMatch) {
          const serviceAccount = JSON.parse(jsonMatch[0]);
          console.log('Found service account JSON!');
          console.log('Project ID:', serviceAccount.project_id);
          console.log('Client Email:', serviceAccount.client_email);
          console.log('Private Key length:', serviceAccount.private_key?.length);
          
          try {
            const parsed = crypto.createPrivateKey(serviceAccount.private_key);
            console.log('PARSE SUCCESSFUL! Key is mathematically valid.');
          } catch (keyErr) {
            console.error('PARSE FAILED:', keyErr);
          }
          break;
        }
      } catch (err) {
        // Ignored
      }
    }
  }
} else {
  console.log('Transcript file not found.');
}
