import { GoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '@/stores';
import { toast } from 'sonner';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

interface GoogleSignInButtonProps {
  onSuccess: () => void;
  remember?: boolean;
  // Solo aplica cuando se crea una cuenta nueva; para una cuenta existente el rol ya está definido.
  role?: 'client' | 'seller' | 'ingenio';
}

// No se renderiza nada si el servidor no configuró VITE_GOOGLE_CLIENT_ID.
export function GoogleSignInButton({ onSuccess, remember = true, role }: GoogleSignInButtonProps) {
  const { loginWithGoogle } = useAuthStore();

  if (!GOOGLE_CLIENT_ID) return null;

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
