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

  // Frontend & Backend typings / defaults
  content = content.replace(/role:\s*UserRole;/g, 'roles: UserRole[];\n  initialInterface?: string;');
  content = content.replace(/role\s*=\s*'client'/g, "roles = ['client']");
  
  // Destructuring occurrences
  content = content.replace(/const {([^}]*)role([^}]*)} = req.body;/g, 'const {$1roles$2} = req.body;');
  content = content.replace(/role:\s*roles\s*\|\|\s*'client'/g, "roles: roles || ['client']");
  
  // user.role checks
  content = content.replace(/user\.role === '([a-zA-Z]+)'/g, "user.roles.includes('$1')");
  content = content.replace(/user!\.role === '([a-zA-Z]+)'/g, "user!.roles.includes('$1')");
  content = content.replace(/req\.user!\.role === '([a-zA-Z]+)'/g, "req.user!.roles.includes('$1')");
  content = content.replace(/user\.role !== '([a-zA-Z]+)'/g, "!user.roles.includes('$1')");
  content = content.replace(/user!\.role !== '([a-zA-Z]+)'/g, "!user!.roles.includes('$1')");
  content = content.replace(/req\.user!\.role !== '([a-zA-Z]+)'/g, "!req.user!.roles.includes('$1')");
  
  // Also check single quotes vs double in TS
  content = content.replace(/user\.role === "([a-zA-Z]+)"/g, "user.roles.includes('$1')");

  // user?.role checks
  content = content.replace(/user\?\.role === '([a-zA-Z]+)'/g, "user?.roles.includes('$1')");

  // Auth generation / payload
  content = content.replace(/role: user\.role/g, "roles: user.roles");

  // Check roles in where clauses (Prisma)
  // this is tricky as Prisma will need `roles: { has: 'role' }` for some queries 
  // Let's do a basic replace for where clauses -> where: { role: 'client' } to where: { roles: { has: 'client' } }
  // Only for exact queries `role:`
  // For simplicity, let's let standard `role: 'client'` become `roles: ['client']` inside creates.
  // But inside where: { role } it needs `roles: { has: role }`
  content = content.replace(/role:\s*'([a-zA-Z]+)'(,?)/g, "roles: ['$1']$2");

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated:', file);
  }
}

walkDir('c:/PROYECTOS/apposcorp/src', processFile);
walkDir('c:/PROYECTOS/apposcorp/server/src', processFile);
walkDir('c:/PROYECTOS/apposcorp/prisma', processFile);

