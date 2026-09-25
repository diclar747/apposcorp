// Volver a la página de origen después de iniciar sesión (p. ej. producto → login → producto).
// Se guarda en sessionStorage para que sobreviva al paso por registro y verificación de email.

const KEY = 'oscorp-post-login-redirect';

/** Solo rutas internas: evita redirecciones abiertas a otros dominios. */
export const safeRedirectPath = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return null;
  if (value.startsWith('/login') || value.startsWith('/register')) return null;
  return value;
};

export const setPostLoginRedirect = (path: string) => {
  const safe = safeRedirectPath(path);
  if (!safe) return;
  try {
    sessionStorage.setItem(KEY, safe);
  } catch {
    // almacenamiento no disponible: se pierde la vuelta, pero el login sigue funcionando
  }
};

/** Devuelve (y borra) el destino guardado, priorizando ?redirect= de la URL. */
export const consumePostLoginRedirect = (fromQuery?: string | null): string | null => {
  let stored: string | null = null;
  try {
    stored = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
  } catch {
    stored = null;
  }
  return safeRedirectPath(fromQuery) || safeRedirectPath(stored);
};

/** Ruta de login que vuelve a la página actual. */
export const loginUrlFor = (path: string) => {
  setPostLoginRedirect(path);
  return `/login?redirect=${encodeURIComponent(path)}`;
};
