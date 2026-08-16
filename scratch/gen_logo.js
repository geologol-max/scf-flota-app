const fs = require('fs');
const b64 = fs.readFileSync('public/nera-logo.png').toString('base64');
fs.writeFileSync('src/utils/neraLogoBase64.ts', `export const NERA_LOGO_BASE64 = "data:image/png;base64,${b64}";\n`);
console.log('Done writing src/utils/neraLogoBase64.ts');
