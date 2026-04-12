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

  // If isActive is true but there's no subscription (or it's pending), 
  // we report status as 'ACTIVE' to allow access.
  const reportingStatus = isActive ? 'ACTIVE' : (sub?.status || 'NONE');

  return {
    status: reportingStatus,
    isActive,
    subscription: sub,
    isReadOnly: !isActive
  };
}
