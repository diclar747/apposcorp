import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePaywallStore } from '@/stores/paywallStore';
import { useIngenioSubscription } from '@/hooks/useIngenioSubscription';
import { SubscriptionModal } from './SubscriptionModal';
import { useAuthStore } from '@/stores';

export function GlobalPaywall() {
  const { user } = useAuthStore();
  const { isOpen, openPaywall, closePaywall } = usePaywallStore();
  const { isActive } = useIngenioSubscription();
  const location = useLocation();

  const isIngenioRoute = location.pathname.startsWith('/ingenio');
  
  useEffect(() => {
    if (!user) {
      if (isOpen) closePaywall();
      return;
    }
    if (isIngenioRoute && !isActive) {
      openPaywall();
    }
  }, [user, isIngenioRoute, isActive, openPaywall, isOpen, closePaywall]);

  if (!user) return null;
  if (!isIngenioRoute && !isOpen) return null;
  if (isActive && !isOpen) return null;

  return (
    <SubscriptionModal 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) closePaywall();
      }} 
    />
  );
}
