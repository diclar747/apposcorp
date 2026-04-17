import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePaywallStore } from '@/stores/paywallStore';
import { useIngenioSubscription } from '@/hooks/useIngenioSubscription';
import { SubscriptionModal } from './SubscriptionModal';

export function GlobalPaywall() {
  const { isOpen, openPaywall, closePaywall } = usePaywallStore();
  const { isActive } = useIngenioSubscription();
  const location = useLocation();

  const isIngenioRoute = location.pathname.startsWith('/ingenio');
  
  useEffect(() => {
    if (isIngenioRoute && !isActive) {
      openPaywall();
    }
  }, [isIngenioRoute, isActive, openPaywall]);

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
