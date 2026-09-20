const fs = require('fs');
const path = require('path');

function processFile(fullPath) {
  let code = fs.readFileSync(fullPath, 'utf8');
  const original = code;
  
  if (fullPath.endsWith('.html')) {
    // HTML: remove <!-- ... -->
    code = code.replace(/<!--[\s\S]*?-->/g, '');
  }
  
  if (code !== original) {
    fs.writeFileSync(fullPath, code, 'utf8');
    console.log(`Stripped: ${fullPath}`);
  }
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
    } else {
      processFile(fullPath);
    }
  }
}

processDirectory(path.join(__dirname, 'frontend'));
