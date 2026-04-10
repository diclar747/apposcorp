const fs = require('fs');

const typings = [
  'server/src/index.ts',
  'server/src/middleware/auth.ts',
  'server/src/routes/courses.ts',
  'server/src/routes/customers.ts',
  'server/src/routes/ingenio.ts',
  'server/src/routes/suppliers.ts',
  'server/src/routes/users.ts'
];

typings.forEach(f => {
  let file = 'c:/PROYECTOS/apposcorp/' + f;
  if (!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf8');
  let startC = c;
  
  // Just blanket replace `.role` to `.roles` where applicable, because TS tells us `.role` is not on User everywhere
  c = c.replace(/\.role(\s*===|\s*!==|[\s\n\)\,}])/g, (match, suffix) => {
    return '.roles' + suffix;
  });

  // Prisma queries: roles: ['ingenio'] doesn't work for query `has` in `EnumUserRoleNullableListFilter`
  // Actually, for UserRole array `roles`, to find if user has 'ingenio', we need `roles: { has: 'ingenio' }`
  c = c.replace(/roles:\s*\['([a-zA-Z]+)'\]/g, "roles: { has: '$1' }");
  // EXCEPT when it's `data: { roles: ['client'] }`. That one is an insert.
  // Wait, I should do this carefully based on the errors.
  
  if (f.endsWith('courses.ts')) {
    // courses.ts(821,16): error TS2559: Type 'string[]' has no properties in common with type 'EnumUserRoleNullableListFilter<"User">'
    c = c.replace(/roles:\s*\['ingenio'\]/g, "roles: { has: 'ingenio' }");
  }
  if (f.endsWith('ingenio.ts')) {
    // ingenio.ts(583,22): error TS2559
    c = c.replace(/roles:\s*\['ingenio'\]/g, "roles: { has: 'ingenio' }");
    // ingenio.ts(314,40): error TS2339: Property 'id' does not exist on type 'JWTPayload'.
    c = c.replace(/req\.user!\.id/g, "req.user!.userId");
  }

  if (f.endsWith('users.ts')) {
    // users.ts(343,7): error TS2552: Cannot find name 'role'. Did you mean 'roles'?
    c = c.replace(/role: /g, "roles: "); 
  }

  if (f.endsWith('auth.ts')) {
    c = c.replace(/data: \{\s*roles: \{ has: 'client' \}\s*\}/, "data: { roles: ['client'] }");
  }

  if (c !== startC) {
    fs.writeFileSync(file, c);
  }
});
