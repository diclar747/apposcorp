import { useAuthStore } from '@/stores';

export function useIngenioSubscription() {
  const { user } = useAuthStore();
  
  // Superadmins always have full access
  if (user?.roles.includes('superadmin')) {
    return {
      status: 'ACTIVE',
      isActive: true,
      subscription: user.ingenioSubscription,
      isReadOnly: false
    };
  }

  const sub = user?.ingenioSubscription;
  const isRevoked = sub?.status === 'REVOKED';
  const isActive = !isRevoked && (user?.ingenioAccess || sub?.status === 'ACTIVE');

  return {
    status: sub?.status || 'NONE',
    isActive,
    subscription: sub,
    isReadOnly: !isActive
  };
}
