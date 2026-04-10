const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function processFile(file) {
  if (!file.endsWith('.ts') && !file.endsWith('.tsx') && !file.endsWith('.js')) return;
  if (file.includes('node_modules') || file.includes('dist')) return;

  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Fix mistakes from previous script
  content = content.replace(/req\.!user!\.roles\.includes/g, "!req.user!.roles.includes");
  // Some others could be malformed: `req.!user!`
  content = content.replace(/req\.!user!/g, "!req.user!");

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed syntax:', file);
  }
}

walkDir('c:/PROYECTOS/apposcorp/src', processFile);
walkDir('c:/PROYECTOS/apposcorp/server/src', processFile);
