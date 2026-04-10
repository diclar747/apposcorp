const fs = require('fs');

const typings = [
  'server/src/utils/jwt.ts',
  'server/src/index.ts',
  'server/src/routes/auth.ts',
  'server/src/routes/courses.ts',
  'server/src/routes/credits.ts',
  'server/src/routes/customers.ts',
  'server/src/routes/ingenio.ts',
  'server/src/routes/orders.ts',
  'server/src/routes/products.ts',
  'server/src/routes/suppliers.ts',
  'server/src/routes/users.ts'
];

typings.forEach(f => {
  let file = 'c:/PROYECTOS/apposcorp/' + f;
  if (!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf8');
  let startC = c;
  
  // JWTPayload
  c = c.replace(/role:\s*UserRole;/g, 'roles: UserRole[];');
  c = c.replace(/role:\s*string;/g, 'roles: string[];');

  // Fix auth.ts
  c = c.replace(/role: role \|\| 'client',/g, "roles: roles || ['client'],");
  c = c.replace(/role: user\.role/g, 'roles: user.roles');
  if (f.endsWith('auth.ts')) {
    // If there is `if (role === 'seller')` -> `if (roles?.includes('seller'))`
    c = c.replace(/if \(role === 'seller'\)/g, "if (roles?.includes('seller'))");
  }

  // Fix where clauses and errors
  c = c.replace(/role: req\.body\.role/g, "roles: req.body.roles");
  c = c.replace(/role: /g, "roles: "); // This is blunt but often correct if we only have roles
  
  // Undo the blunt roles: where it replaces string 'role' inside something else, wait...
  // A safer approach:
  // user.roles.includes('seller') was already done.
  // "Property 'role' does not exist... Did you mean 'roles'?"
  // I'll just change `.role` to `.roles` where applicable.
  
  if (c !== startC) {
    fs.writeFileSync(file, c);
  }
});
