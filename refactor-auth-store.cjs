const fs = require('fs');

const file = 'c:/PROYECTOS/apposcorp/src/stores/authStore.ts';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(/error: string \| null;/g, `error: string | null;\n  interfaceMode?: string;\n\n  setInterfaceMode: (mode: string) => void;`);

c = c.replace(/hasRole: \(roles: UserRole\[\]\) => boolean;/g, `hasRole: (roles: UserRole[]) => boolean;\n  addRole: (role: UserRole) => Promise<boolean>;`);

c = c.replace(/error: null,/, `error: null,\n      interfaceMode: 'OSCORP',\n\n      setInterfaceMode: (mode: string) => set({ interfaceMode: mode }),`);

c = c.replace(/hasRole: \(roles: UserRole\[\]\) => \{([^}]+)\},/g, `hasRole: (roles: UserRole[]) => {$1},\n\n      addRole: async (role: UserRole) => {\n        set({ isLoading: true, error: null });\n        try {\n          const response = await authApi.addRole(role);\n          if (response.token) {\n            localStorage.setItem('oscorp-token', response.token);\n          }\n          set({\n            user: response.user || response,\n            ...(response.token ? { token: response.token } : {}),\n            isLoading: false,\n            error: null\n          });\n          return true;\n        } catch (error: any) {\n          set({ isLoading: false, error: error.message || 'Error al agregar rol' });\n          return false;\n        }\n      },`);

c = c.replace(/isAuthenticated: state\.isAuthenticated/, "isAuthenticated: state.isAuthenticated,\n        interfaceMode: state.interfaceMode");

fs.writeFileSync(file, c);
console.log('Modified store');
