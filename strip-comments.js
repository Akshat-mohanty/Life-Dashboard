const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function stripComments(code) {
  // A simplistic but mostly effective state machine / regex for JS
  // Better to use a dedicated package if possible, but let's use a regex that matches strings first
  const regex = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g;
  return code.replace(regex, (match, stringLiteral) => {
    if (stringLiteral) return stringLiteral; // Keep strings intact
    return ''; // Remove comments
  });
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (!['node_modules', '.git', 'dist', '.aws-sam'].includes(file)) {
        processDirectory(fullPath);
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      const code = fs.readFileSync(fullPath, 'utf8');
      const stripped = stripComments(code);
      if (code !== stripped) {
        fs.writeFileSync(fullPath, stripped, 'utf8');
        console.log(`Stripped: ${fullPath}`);
      }
    }
  }
}

processDirectory(path.join(__dirname, 'frontend/src'));
processDirectory(path.join(__dirname, 'backend/src'));
