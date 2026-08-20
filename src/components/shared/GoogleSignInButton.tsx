import { GoogleLogin } from '@react-oauth/google';
import { useAuthStore, useSettingsStore } from '@/stores';
import { toast } from 'sonner';

interface GoogleSignInButtonProps {
  onSuccess: () => void;
  remember?: boolean;
  // Solo aplica cuando se crea una cuenta nueva; para una cuenta existente el rol ya está definido.
  role?: 'client' | 'seller' | 'ingenio';
}

// No se renderiza nada si el servidor no configuró GOOGLE_CLIENT_ID (o mientras carga).
export function GoogleSignInButton({ onSuccess, remember = true, role }: GoogleSignInButtonProps) {
  const { loginWithGoogle } = useAuthStore();
  const { settings } = useSettingsStore();

  if (!settings.google_client_id) return null;

  return (
    <div className="flex justify-center [&>div]:w-full">
      <GoogleLogin
        onSuccess={async (credentialResponse) => {
          if (!credentialResponse.credential) {
            toast.error('No se pudo obtener la credencial de Google');
            return;
          }
          const success = await loginWithGoogle(credentialResponse.credential, remember, role);
          if (success) {
            onSuccess();
          } else {
            const authError = useAuthStore.getState().error;
            toast.error(authError || 'Error al iniciar sesión con Google');
          }
        }}
        onError={() => toast.error('No se pudo iniciar sesión con Google')}
        theme="outline"
        size="large"
        text="continue_with"
        shape="pill"
      />
    </div>
  );
}
